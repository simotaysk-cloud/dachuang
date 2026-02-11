package com.example.dachuang.blockchain;

import com.example.dachuang.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.generated.Bytes32;
import org.web3j.abi.TypeReference;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.WalletUtils;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthGasPrice;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.protocol.core.methods.response.EthGetTransactionReceipt;
import org.web3j.protocol.core.methods.response.EthTransaction;
import org.web3j.protocol.core.methods.response.Log;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;
import java.util.Collections;
import java.util.HexFormat;
import java.util.List;

@Component
@RequiredArgsConstructor
public class EvmBlockchainClient {
    private static final String ANCHORED_EVENT_TOPIC = "0xaedca9a405143e6b6f9037a03b227546ec9c40c94c17ab19633e21abd56bde82";

    @Value("${app.blockchain.evm.rpc-url:}")
    private String rpcUrl;

    @Value("${app.blockchain.evm.chain-id:0}")
    private long chainId;

    @Value("${app.blockchain.evm.private-key:}")
    private String privateKey;

    @Value("${app.blockchain.evm.contract-address:}")
    private String contractAddress;

    @Value("${app.blockchain.evm.gas-limit:300000}")
    private long gasLimit;

    @Value("${app.blockchain.evm.gas-price-wei:}")
    private String gasPriceWei;

    @Value("${app.blockchain.evm.explorer-tx-url:}")
    private String explorerTxUrl;

    public String getContractAddress() {
        return contractAddress;
    }

    public boolean isConfigured() {
        return rpcUrl != null && !rpcUrl.isBlank()
                && privateKey != null && !privateKey.isBlank()
                && contractAddress != null && WalletUtils.isValidAddress(contractAddress)
                && isValidPrivateKey(privateKey);
    }

    public AnchorResult anchor(String batchNo, String data) {
        if (!isConfigured()) {
            throw new BusinessException(500, "EVM blockchain is not configured (rpc-url/private-key/contract-address). EVM_PRIVATE_KEY must be a 32-byte hex private key, not a wallet address.");
        }
        if (batchNo == null || batchNo.isBlank()) {
            throw new BusinessException(400, "batchNo is required");
        }

        byte[] hashBytes = sha256Bytes(data == null ? "" : data);
        String dataHashHex = "sha256:" + HexFormat.of().formatHex(hashBytes);

        Web3j web3j = Web3j.build(new HttpService(rpcUrl));
        Credentials credentials = Credentials.create(normalizePrivateKey(privateKey));
        TransactionManager tm = new RawTransactionManager(web3j, credentials, chainId);

        BigInteger gasPrice = resolveGasPrice(web3j);
        BigInteger gasLimitBi = BigInteger.valueOf(gasLimit);

        Function fn = new Function(
                "anchor",
                List.of(new Utf8String(batchNo), new Bytes32(hashBytes)),
                Collections.emptyList()
        );
        String callData = FunctionEncoder.encode(fn);

        try {
            EthSendTransaction sent = tm.sendTransaction(gasPrice, gasLimitBi, contractAddress, callData, BigInteger.ZERO);
            if (sent.hasError()) {
                throw new BusinessException(502, "EVM tx failed: " + sent.getError().getMessage());
            }
            String txHash = sent.getTransactionHash();
            String txUrl = (explorerTxUrl == null || explorerTxUrl.isBlank()) ? "" : explorerTxUrl + txHash;
            return new AnchorResult(txHash, txUrl, dataHashHex);
        } catch (Exception e) {
            throw new BusinessException(502, "EVM tx failed");
        } finally {
            try {
                web3j.shutdown();
            } catch (Exception ignored) {
            }
        }
    }

    public TxQueryResult queryTransaction(String txHash) {
        if (txHash == null || txHash.isBlank()) {
            return new TxQueryResult(TxState.INVALID_HASH, false, false, "");
        }
        String normalized = txHash.trim();
        if (!normalized.matches("^0x[0-9a-fA-F]{64}$")) {
            return new TxQueryResult(TxState.INVALID_HASH, false, false, "");
        }
        if (!isConfigured()) {
            return new TxQueryResult(TxState.UNVERIFIED, false, false, "");
        }

        Web3j web3j = Web3j.build(new HttpService(rpcUrl));
        try {
            EthTransaction txResp = web3j.ethGetTransactionByHash(normalized).send();
            if (txResp == null || txResp.getTransaction().isEmpty()) {
                return new TxQueryResult(TxState.NOT_FOUND, false, false, normalized);
            }

            var tx = txResp.getTransaction().get();
            boolean mined = tx.getBlockHash() != null && !tx.getBlockHash().isBlank()
                    && tx.getBlockNumber() != null;

            EthGetTransactionReceipt receiptResp = web3j.ethGetTransactionReceipt(normalized).send();
            boolean receiptPresent = receiptResp != null && receiptResp.getTransactionReceipt().isPresent();
            boolean success = false;
            if (receiptPresent) {
                var receipt = receiptResp.getTransactionReceipt().get();
                String status = receipt.getStatus();
                success = "0x1".equalsIgnoreCase(status) || "1".equals(status);
            }

            if (!receiptPresent || !mined) {
                return new TxQueryResult(TxState.PENDING, true, false, normalized);
            }
            return new TxQueryResult(success ? TxState.CONFIRMED : TxState.FAILED, true, success, normalized);
        } catch (Exception e) {
            return new TxQueryResult(TxState.UNVERIFIED, false, false, normalized);
        } finally {
            try {
                web3j.shutdown();
            } catch (Exception ignored) {
            }
        }
    }

    public String readAnchoredHashHex(String batchNo) {
        if (!isConfigured()) {
            throw new BusinessException(500, "EVM blockchain is not configured (rpc-url/private-key/contract-address)");
        }
        if (batchNo == null || batchNo.isBlank()) {
            throw new BusinessException(400, "batchNo is required");
        }

        Web3j web3j = Web3j.build(new HttpService(rpcUrl));
        Credentials credentials = Credentials.create(normalizePrivateKey(privateKey));
        try {
            // The minimal demo contract exposes: mapping(string => bytes32) public hashes;
            Function fn = new Function(
                    "hashes",
                    List.of(new Utf8String(batchNo)),
                    List.of(new TypeReference<Bytes32>() {
                    })
            );
            String data = FunctionEncoder.encode(fn);
            EthCall call = web3j.ethCall(
                    Transaction.createEthCallTransaction(credentials.getAddress(), contractAddress, data),
                    DefaultBlockParameterName.LATEST
            ).send();
            String value = call.getValue();
            if (value == null || value.equals("0x")) {
                return "";
            }
            List<Type> out = FunctionReturnDecoder.decode(value, fn.getOutputParameters());
            if (out == null || out.isEmpty()) {
                return "";
            }
            Bytes32 b = (Bytes32) out.get(0);
            byte[] bytes = b.getValue();
            return "sha256:" + HexFormat.of().formatHex(bytes);
        } catch (Exception e) {
            throw new BusinessException(502, "EVM read failed (contract ABI mismatch or RPC error)");
        } finally {
            try {
                web3j.shutdown();
            } catch (Exception ignored) {
            }
        }
    }

    public String readAnchoredHashFromTx(String txHash) {
        if (!isConfigured()) {
            throw new BusinessException(500, "EVM blockchain is not configured (rpc-url/private-key/contract-address)");
        }
        if (txHash == null || txHash.isBlank()) {
            return "";
        }

        Web3j web3j = Web3j.build(new HttpService(rpcUrl));
        try {
            EthGetTransactionReceipt receiptResp = web3j.ethGetTransactionReceipt(txHash).send();
            if (receiptResp == null || receiptResp.getTransactionReceipt().isEmpty()) {
                return "";
            }

            var receipt = receiptResp.getTransactionReceipt().get();
            List<Log> logs = receipt.getLogs();
            if (logs == null || logs.isEmpty()) {
                return "";
            }

            for (Log log : logs) {
                if (log == null) continue;
                if (log.getAddress() == null || !log.getAddress().equalsIgnoreCase(contractAddress)) continue;
                List<String> topics = log.getTopics();
                if (topics == null || topics.isEmpty()) continue;
                if (!ANCHORED_EVENT_TOPIC.equalsIgnoreCase(topics.get(0))) continue;

                String hash = extractDataHashFromAnchoredEventData(log.getData());
                if (!hash.isBlank()) return hash;
            }
            return "";
        } catch (Exception e) {
            throw new BusinessException(502, "EVM read failed (tx receipt parsing error)");
        } finally {
            try {
                web3j.shutdown();
            } catch (Exception ignored) {
            }
        }
    }

    private static String extractDataHashFromAnchoredEventData(String data) {
        if (data == null) return "";
        String hex = data.startsWith("0x") ? data.substring(2) : data;
        // Anchored(string batchNo, bytes32 dataHash, address indexed sender, uint256 timestamp)
        // Non-indexed payload starts with:
        // word0: string offset, word1: bytes32 dataHash, word2: timestamp ...
        if (hex.length() < 128) return "";
        String hashHex = hex.substring(64, 128).toLowerCase(Locale.ROOT);
        if (hashHex.matches("^0+$")) return "";
        return "sha256:" + hashHex;
    }

    private BigInteger resolveGasPrice(Web3j web3j) {
        if (gasPriceWei != null && !gasPriceWei.isBlank()) {
            try {
                return new BigInteger(gasPriceWei.trim());
            } catch (Exception ignored) {
            }
        }
        try {
            EthGasPrice gp = web3j.ethGasPrice().send();
            return gp.getGasPrice() == null ? BigInteger.valueOf(1_000_000_000L) : gp.getGasPrice();
        } catch (Exception e) {
            return BigInteger.valueOf(1_000_000_000L);
        }
    }

    private static boolean isValidPrivateKey(String pk) {
        try {
            normalizePrivateKey(pk);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static String normalizePrivateKey(String pk) {
        String s = (pk == null) ? "" : pk.trim();
        if (s.startsWith("0x") || s.startsWith("0X")) {
            s = s.substring(2);
        }
        s = s.toLowerCase(Locale.ROOT);
        // A private key is 32 bytes => 64 hex chars.
        if (s.length() != 64 || !s.matches("^[0-9a-f]{64}$")) {
            throw new IllegalArgumentException("invalid private key");
        }
        return s;
    }

    private static byte[] sha256Bytes(String data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest((data == null ? "" : data).getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            // Should never happen on modern JVMs.
            throw new IllegalStateException("SHA-256 not available");
        }
    }

    public record AnchorResult(String txHash, String txUrl, String dataHash) {
    }

    public enum TxState {
        CONFIRMED,
        FAILED,
        PENDING,
        NOT_FOUND,
        INVALID_HASH,
        UNVERIFIED
    }

    public record TxQueryResult(TxState state, boolean found, boolean success, String txHash) {
    }
}
