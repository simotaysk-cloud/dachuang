package com.example.dachuang.blockchain;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.example.dachuang.trace.service.BatchService;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BlockchainService {

    private final BlockchainRecordRepository blockchainRecordRepository;
    private final BatchService batchService;

    public String recordOnChain(String batchNo, String data) {
        // Enforce referential integrity at the application layer too (DB has FK).
        batchService.getBatchByNo(batchNo);

        // Mocking blockchain transaction
        String txHash = "0x" + UUID.randomUUID().toString().replace("-", "");

        String dataHash = "sha256:" + UUID.randomUUID().toString().substring(0, 8);

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
        return txHash;
    }

    public BlockchainRecord getRecord(String batchNo) {
        return blockchainRecordRepository.findByBatchNo(batchNo).orElse(null);
    }
}
