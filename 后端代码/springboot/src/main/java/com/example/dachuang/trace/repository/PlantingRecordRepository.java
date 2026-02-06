package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.PlantingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlantingRecordRepository extends JpaRepository<PlantingRecord, Long> {
    List<PlantingRecord> findAllByBatchNo(String batchNo);
}
