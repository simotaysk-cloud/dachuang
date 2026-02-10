package com.example.dachuang.trace.service;

import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.entity.ProcessingRecord;
import com.example.dachuang.trace.repository.ProcessingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProcessingRecordService {

    private final ProcessingRecordRepository processingRecordRepository;
    private final BatchService batchService;

    public List<ProcessingRecord> list(String batchNo, String parentBatchNo) {
        if (batchNo != null && !batchNo.isBlank()) {
            return processingRecordRepository.findAllByBatchNo(batchNo);
        }
        if (parentBatchNo != null && !parentBatchNo.isBlank()) {
            return processingRecordRepository.findAllByParentBatchNo(parentBatchNo);
        }
        return processingRecordRepository.findAll();
    }

    public ProcessingRecord getById(Long id) {
        return processingRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Processing record not found"));
    }

    public ProcessingRecord create(ProcessingRecord record) {
        // If a parent is provided, treat this as a potential divergence point.
        if (record.getParentBatchNo() != null && !record.getParentBatchNo().isBlank()) {
            String parentNo = record.getParentBatchNo().trim();
            String childNo = record.getBatchNo();
            Batch child = batchService.deriveBatch(parentNo, childNo, "PROCESSING", record.getProcessType(),
                    record.getDetails());
            record.setBatchNo(child.getBatchNo());
        } else {
            batchService.getBatchByNo(record.getBatchNo());
        }
        return processingRecordRepository.save(record);
    }

    public ProcessingRecord update(Long id, ProcessingRecord record) {
        ProcessingRecord existing = processingRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Processing record not found"));
        batchService.getBatchByNo(record.getBatchNo());
        if (record.getParentBatchNo() != null && !record.getParentBatchNo().isBlank()) {
            batchService.getBatchByNo(record.getParentBatchNo());
        }
        existing.setBatchNo(record.getBatchNo());
        existing.setParentBatchNo(record.getParentBatchNo());
        existing.setProcessType(record.getProcessType());
        existing.setLineName(record.getLineName());
        existing.setFactory(record.getFactory());
        existing.setDetails(record.getDetails());
        existing.setOperator(record.getOperator());
        existing.setImageUrl(record.getImageUrl());
        return processingRecordRepository.save(existing);
    }

    public void delete(Long id) {
        processingRecordRepository.deleteById(id);
    }
}
