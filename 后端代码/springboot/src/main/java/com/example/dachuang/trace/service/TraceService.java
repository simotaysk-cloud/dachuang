package com.example.dachuang.trace.service;

import com.example.dachuang.trace.dto.TraceResponse;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TraceService {

    private final BatchService batchService;
    private final PlantingRecordRepository plantingRecordRepository;
    private final ProcessingRecordRepository processingRecordRepository;
    private final LogisticsRecordRepository logisticsRecordRepository;
    private final InspectionRecordRepository inspectionRecordRepository;

    public TraceResponse getFullTraceByBatchNo(String batchNo) {
        Batch batch = batchService.getBatchByNo(batchNo);

        return TraceResponse.builder()
                .batch(batch)
                .plantingRecords(plantingRecordRepository.findAllByBatchNo(batchNo))
                .processingRecords(processingRecordRepository.findAllByBatchNo(batchNo))
                .logisticsRecords(logisticsRecordRepository.findAllByBatchNo(batchNo))
                .inspectionRecords(inspectionRecordRepository.findAllByBatchNo(batchNo))
                .build();
    }
}
