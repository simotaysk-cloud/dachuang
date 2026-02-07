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
    private final BatchService batchService;

    public List<LogisticsRecord> list(String batchNo) {
        if (batchNo == null || batchNo.isBlank()) {
            return logisticsRecordRepository.findAll();
        }
        return logisticsRecordRepository.findAllByBatchNo(batchNo);
    }

    public LogisticsRecord create(LogisticsRecord record) {
        batchService.getBatchByNo(record.getBatchNo());
        return logisticsRecordRepository.save(record);
    }

    public LogisticsRecord update(Long id, LogisticsRecord record) {
        LogisticsRecord existing = logisticsRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Logistics record not found"));
        if (record.getBatchNo() != null && !record.getBatchNo().isBlank()) {
            batchService.getBatchByNo(record.getBatchNo());
            existing.setBatchNo(record.getBatchNo());
        }

        if (record.getFromLocation() != null && !record.getFromLocation().isBlank()) {
            existing.setFromLocation(record.getFromLocation());
        }
        if (record.getToLocation() != null && !record.getToLocation().isBlank()) {
            existing.setToLocation(record.getToLocation());
        }
        if (record.getTrackingNo() != null && !record.getTrackingNo().isBlank()) {
            existing.setTrackingNo(record.getTrackingNo());
        }

        if (record.getLocation() != null && !record.getLocation().isBlank()) {
            existing.setLocation(record.getLocation());
        }
        if (record.getStatus() != null && !record.getStatus().isBlank()) {
            existing.setStatus(record.getStatus());
        }
        if (record.getUpdateTime() != null) {
            existing.setUpdateTime(record.getUpdateTime());
        }
        return logisticsRecordRepository.save(existing);
    }

    public void delete(Long id) {
        logisticsRecordRepository.deleteById(id);
    }
}
