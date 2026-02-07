package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.ProcessingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProcessingRecordRepository extends JpaRepository<ProcessingRecord, Long> {
    List<ProcessingRecord> findAllByBatchNo(String batchNo);

    List<ProcessingRecord> findAllByParentBatchNo(String parentBatchNo);

    List<ProcessingRecord> findAllByBatchNoIn(List<String> batchNos);
}
