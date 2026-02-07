package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.BatchLineage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BatchLineageRepository extends JpaRepository<BatchLineage, Long> {
    Optional<BatchLineage> findByChildBatchNo(String childBatchNo);

    List<BatchLineage> findAllByParentBatchNo(String parentBatchNo);
}

