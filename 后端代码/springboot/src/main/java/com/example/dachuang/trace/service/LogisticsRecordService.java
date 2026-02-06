package com.example.dachuang.trace.service;

import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.entity.LogisticsRecord;
import com.example.dachuang.trace.repository.LogisticsRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LogisticsRecordService {

    private final LogisticsRecordRepository logisticsRecordRepository;

    public List<LogisticsRecord> list(String batchNo) {
        if (batchNo == null || batchNo.isBlank()) {
            return logisticsRecordRepository.findAll();
        }
        return logisticsRecordRepository.findAllByBatchNo(batchNo);
    }

    public LogisticsRecord create(LogisticsRecord record) {
        return logisticsRecordRepository.save(record);
    }

    public LogisticsRecord update(Long id, LogisticsRecord record) {
        LogisticsRecord existing = logisticsRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Logistics record not found"));
        existing.setBatchNo(record.getBatchNo());
        existing.setFromLocation(record.getFromLocation());
        existing.setToLocation(record.getToLocation());
        existing.setStatus(record.getStatus());
        existing.setTrackingNo(record.getTrackingNo());
        return logisticsRecordRepository.save(existing);
    }

    public void delete(Long id) {
        logisticsRecordRepository.deleteById(id);
    }
}
