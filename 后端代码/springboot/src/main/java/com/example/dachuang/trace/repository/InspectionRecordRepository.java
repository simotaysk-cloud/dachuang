package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.InspectionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InspectionRecordRepository extends JpaRepository<InspectionRecord, Long> {
    List<InspectionRecord> findAllByBatchNo(String batchNo);
}
