package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    Optional<Batch> findByBatchNo(String batchNo);

    Optional<Batch> findByMinCode(String minCode);

    boolean existsByGs1LotNo(String gs1LotNo);

    @Query("SELECT b FROM Batch b WHERE b.batchNo NOT IN (SELECT bl.childBatchNo FROM BatchLineage bl)")
    List<Batch> findRootBatches();
}
