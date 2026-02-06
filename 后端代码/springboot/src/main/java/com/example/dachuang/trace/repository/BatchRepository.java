package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    Optional<Batch> findByBatchNo(String batchNo);
}
