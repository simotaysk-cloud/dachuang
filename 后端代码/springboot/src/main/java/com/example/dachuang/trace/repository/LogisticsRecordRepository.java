package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.LogisticsRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LogisticsRecordRepository extends JpaRepository<LogisticsRecord, Long> {
    List<LogisticsRecord> findAllByBatchNo(String batchNo);
}
