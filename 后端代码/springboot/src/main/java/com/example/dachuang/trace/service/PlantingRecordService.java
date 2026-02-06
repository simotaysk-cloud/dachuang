package com.example.dachuang.trace.service;

import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.entity.PlantingRecord;
import com.example.dachuang.trace.repository.PlantingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlantingRecordService {

    private final PlantingRecordRepository plantingRecordRepository;

    public List<PlantingRecord> list(String batchNo) {
        if (batchNo == null || batchNo.isBlank()) {
            return plantingRecordRepository.findAll();
        }
        return plantingRecordRepository.findAllByBatchNo(batchNo);
    }

    public PlantingRecord create(PlantingRecord record) {
        return plantingRecordRepository.save(record);
    }

    public PlantingRecord update(Long id, PlantingRecord record) {
        PlantingRecord existing = plantingRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Planting record not found"));
        existing.setBatchNo(record.getBatchNo());
        existing.setFieldName(record.getFieldName());
        existing.setOperation(record.getOperation());
        existing.setDetails(record.getDetails());
        existing.setOperator(record.getOperator());
        return plantingRecordRepository.save(existing);
    }

    public void delete(Long id) {
        plantingRecordRepository.deleteById(id);
    }
}
