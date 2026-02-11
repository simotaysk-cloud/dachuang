package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.InspectionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface InspectionRecordRepository extends JpaRepository<InspectionRecord, Long> {
    List<InspectionRecord> findAllByBatchNo(String batchNo);

    List<InspectionRecord> findAllByBatchNoIn(List<String> batchNos);

    @Query("SELECT COUNT(DISTINCT i.batchNo) FROM InspectionRecord i")
    long countDistinctBatchNo();

    @Query("""
            SELECT COUNT(DISTINCT i.batchNo)
            FROM InspectionRecord i
            WHERE i.batchNo IN (
                SELECT b.batchNo
                FROM Batch b
                WHERE b.batchNo NOT IN (
                    SELECT bl.parentBatchNo
                    FROM BatchLineage bl
                )
            )
            """)
    long countDistinctLeafBatchNo();
}
