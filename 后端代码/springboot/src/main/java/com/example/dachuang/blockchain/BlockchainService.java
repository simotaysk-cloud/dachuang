package com.example.dachuang.blockchain;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import com.example.dachuang.trace.service.BatchService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BlockchainService {

    private final BlockchainRecordRepository blockchainRecordRepository;
    private final BatchService batchService;
    private final EvmBlockchainClient evmBlockchainClient;

    @Value("${app.blockchain.mode:MOCK}")
    private String mode;

    public RecordResult recordOnChain(String batchNo, String data) {
        // Enforce referential integrity at the application layer too (DB has FK).
        batchService.getBatchByNo(batchNo);

        String dataHash = sha256Hex(data == null ? "" : data);
        String txHash;
        String txUrl = "";

        if (BlockchainMode.EVM.name().equalsIgnoreCase(mode)) {
            EvmBlockchainClient.AnchorResult r = evmBlockchainClient.anchor(batchNo, data);
            txHash = r.txHash();
            // keep dataHash computed from the provided payload (same as on-chain)
            dataHash = r.dataHash();
            txUrl = r.txUrl();
        } else {
            // Mocking blockchain transaction
            txHash = "0x" + UUID.randomUUID().toString().replace("-", "");
        }

        BlockchainRecord record = blockchainRecordRepository.findByBatchNo(batchNo).orElse(null);
        if (record == null) {
            record = BlockchainRecord.builder()
                    .batchNo(batchNo)
                    .txHash(txHash)
                    .dataHash(dataHash)
                    .build();
        } else {
            record.setTxHash(txHash);
            record.setDataHash(dataHash);
        }

        blockchainRecordRepository.save(record);
        return new RecordResult(txHash, dataHash, txUrl, mode);
    }

    public BlockchainRecord getRecord(String batchNo) {
        return blockchainRecordRepository.findByBatchNo(batchNo).orElse(null);
    }

    private static String sha256Hex(String data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest((data == null ? "" : data).getBytes(StandardCharsets.UTF_8));
            return "sha256:" + HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available");
        }
    }

    public record RecordResult(String txHash, String dataHash, String txUrl, String mode) {
    }
}
