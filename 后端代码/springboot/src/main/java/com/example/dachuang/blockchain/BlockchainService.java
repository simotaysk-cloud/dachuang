package com.example.dachuang.blockchain;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BlockchainService {

    private final BlockchainRecordRepository blockchainRecordRepository;

    public String recordOnChain(String batchNo, String data) {
        // Mocking blockchain transaction
        String txHash = "0x" + UUID.randomUUID().toString().replace("-", "");

        BlockchainRecord record = BlockchainRecord.builder()
                .batchNo(batchNo)
                .txHash(txHash)
                .dataHash("sha256:" + UUID.randomUUID().toString().substring(0, 8))
                .build();

        blockchainRecordRepository.save(record);
        return txHash;
    }

    public BlockchainRecord getRecord(String batchNo) {
        return blockchainRecordRepository.findByBatchNo(batchNo).orElse(null);
    }
}
