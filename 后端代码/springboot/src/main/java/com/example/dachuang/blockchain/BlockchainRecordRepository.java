package com.example.dachuang.blockchain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BlockchainRecordRepository extends JpaRepository<BlockchainRecord, Long> {
    Optional<BlockchainRecord> findByBatchNo(String batchNo);
}
