package com.example.dachuang.trace.service;

import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.entity.ProcessingRecord;
import com.example.dachuang.trace.repository.ProcessingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProcessingRecordService {

    private final ProcessingRecordRepository processingRecordRepository;

    public List<ProcessingRecord> list(String batchNo) {
        if (batchNo == null || batchNo.isBlank()) {
            return processingRecordRepository.findAll();
        }
        return processingRecordRepository.findAllByBatchNo(batchNo);
    }

    public ProcessingRecord create(ProcessingRecord record) {
        return processingRecordRepository.save(record);
    }

    public ProcessingRecord update(Long id, ProcessingRecord record) {
        ProcessingRecord existing = processingRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Processing record not found"));
        existing.setBatchNo(record.getBatchNo());
        existing.setProcessType(record.getProcessType());
        existing.setFactory(record.getFactory());
        existing.setDetails(record.getDetails());
        existing.setOperator(record.getOperator());
        return processingRecordRepository.save(existing);
    }

    public void delete(Long id) {
        processingRecordRepository.deleteById(id);
    }
}
