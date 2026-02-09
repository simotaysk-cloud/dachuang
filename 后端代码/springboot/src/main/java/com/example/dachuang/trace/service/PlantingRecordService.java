package com.example.dachuang.trace.service;

import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.entity.PlantingRecord;
import com.example.dachuang.trace.repository.PlantingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PlantingRecordService {

    private final PlantingRecordRepository plantingRecordRepository;
    private final BatchService batchService;

    private static final Set<String> KEY_OPERATIONS = Set.of(
            "播种",
            "施肥",
            "灌溉",
            "除草",
            "病虫害防治",
            "采收"
    );

    public List<PlantingRecord> list(String batchNo) {
        if (batchNo == null || batchNo.isBlank()) {
            return plantingRecordRepository.findAll();
        }
        return plantingRecordRepository.findAllByBatchNo(batchNo);
    }

    public PlantingRecord getById(Long id) {
        return plantingRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Planting record not found"));
    }

    public PlantingRecord create(PlantingRecord record) {
        batchService.getBatchByNo(record.getBatchNo());
        if (record.getOperationTime() == null) {
            record.setOperationTime(LocalDateTime.now());
        }
        validateEvidenceAndGeo(record);
        return plantingRecordRepository.save(record);
    }

    public PlantingRecord update(Long id, PlantingRecord record) {
        PlantingRecord existing = plantingRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Planting record not found"));
        batchService.getBatchByNo(record.getBatchNo());
        validateEvidenceAndGeo(record);
        existing.setBatchNo(record.getBatchNo());
        existing.setFieldName(record.getFieldName());
        existing.setOperation(record.getOperation());
        existing.setDetails(record.getDetails());
        existing.setOperator(record.getOperator());
        existing.setImageUrl(record.getImageUrl());
        existing.setAudioUrl(record.getAudioUrl());
        existing.setLatitude(record.getLatitude());
        existing.setLongitude(record.getLongitude());
        // Optional: allow manual set; if absent, keep existing; if legacy data missing, fill.
        if (record.getOperationTime() != null) {
            existing.setOperationTime(record.getOperationTime());
        } else if (existing.getOperationTime() == null) {
            existing.setOperationTime(LocalDateTime.now());
        }
        return plantingRecordRepository.save(existing);
    }

    public void delete(Long id) {
        plantingRecordRepository.deleteById(id);
    }

    private void validateEvidenceAndGeo(PlantingRecord record) {
        String op = record.getOperation() == null ? "" : record.getOperation().trim();
        if (!KEY_OPERATIONS.contains(op)) {
            return;
        }

        boolean hasEvidence = (record.getImageUrl() != null && !record.getImageUrl().isBlank())
                || (record.getAudioUrl() != null && !record.getAudioUrl().isBlank());
        if (!hasEvidence) {
            throw new BusinessException(400, "关键操作需上传现场证据（图片或语音）");
        }

        if (record.getLatitude() == null || record.getLongitude() == null) {
            throw new BusinessException(400, "关键操作需获取定位（请授权定位）");
        }
        double lat = record.getLatitude();
        double lng = record.getLongitude();
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new BusinessException(400, "定位坐标不合法");
        }
    }
}
