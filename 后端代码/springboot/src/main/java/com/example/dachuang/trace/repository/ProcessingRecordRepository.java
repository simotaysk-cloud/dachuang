package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.ProcessingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Map;

public interface ProcessingRecordRepository extends JpaRepository<ProcessingRecord, Long> {
    List<ProcessingRecord> findAllByBatchNo(String batchNo);

    List<ProcessingRecord> findAllByParentBatchNo(String parentBatchNo);

    List<ProcessingRecord> findAllByBatchNoIn(List<String> batchNos);

    @org.springframework.data.jpa.repository.Query("SELECT p.processType as name, COUNT(p) as value FROM ProcessingRecord p GROUP BY p.processType")
    List<Map<String, Object>> countByProcessType();
}
