package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.List;
import java.util.Map;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    Optional<Batch> findByBatchNo(String batchNo);

    Optional<Batch> findByMinCode(String minCode);

    boolean existsByGs1LotNo(String gs1LotNo);

    @Query("SELECT b FROM Batch b WHERE b.batchNo NOT IN (SELECT bl.childBatchNo FROM BatchLineage bl)")
    List<Batch> findRootBatches();

    @Query("SELECT COUNT(DISTINCT b.name) FROM Batch b")
    long countDistinctHerbNames();

    @Query("SELECT b.origin as name, COUNT(b) as value FROM Batch b GROUP BY b.origin")
    List<Map<String, Object>> countByOrigin();
}
