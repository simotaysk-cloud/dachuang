package com.example.dachuang.blockchain;

import com.example.dachuang.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.generated.Bytes32;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.WalletUtils;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.EthGasPrice;
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
}
