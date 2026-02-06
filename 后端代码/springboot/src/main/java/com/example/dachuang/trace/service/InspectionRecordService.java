package com.example.dachuang.trace.service;

import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.entity.InspectionRecord;
import com.example.dachuang.trace.repository.InspectionRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InspectionRecordService {

    private final InspectionRecordRepository inspectionRecordRepository;

    public List<InspectionRecord> list(String batchNo) {
        if (batchNo == null || batchNo.isBlank()) {
            return inspectionRecordRepository.findAll();
        }
        return inspectionRecordRepository.findAllByBatchNo(batchNo);
    }

    public InspectionRecord create(InspectionRecord record) {
        return inspectionRecordRepository.save(record);
    }

    public InspectionRecord update(Long id, InspectionRecord record) {
        InspectionRecord existing = inspectionRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Inspection record not found"));
        existing.setBatchNo(record.getBatchNo());
        existing.setResult(record.getResult());
        existing.setReportUrl(record.getReportUrl());
        existing.setInspector(record.getInspector());
        return inspectionRecordRepository.save(existing);
    }

    public void delete(Long id) {
        inspectionRecordRepository.deleteById(id);
    }
}
