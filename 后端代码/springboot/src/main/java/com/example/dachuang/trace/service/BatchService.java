package com.example.dachuang.trace.service;

import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.repository.BatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BatchService {

    private final BatchRepository batchRepository;

    public List<Batch> getAllBatches() {
        return batchRepository.findAll();
    }

    public Batch getBatchByNo(String batchNo) {
        return batchRepository.findByBatchNo(batchNo)
                .orElseThrow(() -> new BusinessException(404, "Batch not found"));
    }

    public Batch createBatch(Batch batch) {
        if (batchRepository.findByBatchNo(batch.getBatchNo()).isPresent()) {
            throw new BusinessException(400, "Batch number already exists");
        }
        // 生成隐形码（如果未提供）
        if (batch.getMinCode() == null || batch.getMinCode().isBlank()) {
            batch.setMinCode(java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        }
        return batchRepository.save(batch);
    }

    public Batch updateBatch(Long id, Batch batchDetails) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Batch not found"));

        batch.setName(batchDetails.getName());
        batch.setCategory(batchDetails.getCategory());
        batch.setOrigin(batchDetails.getOrigin());
        batch.setStatus(batchDetails.getStatus());
        batch.setDescription(batchDetails.getDescription());

        return batchRepository.save(batch);
    }

    public void deleteBatch(Long id) {
        batchRepository.deleteById(id);
    }
}
