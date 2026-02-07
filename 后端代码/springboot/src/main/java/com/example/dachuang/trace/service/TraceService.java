package com.example.dachuang.trace.service;

import com.example.dachuang.trace.dto.TraceResponse;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.entity.BatchLineage;
import com.example.dachuang.trace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TraceService {

    private final BatchService batchService;
    private final PlantingRecordRepository plantingRecordRepository;
    private final ProcessingRecordRepository processingRecordRepository;
    private final LogisticsRecordRepository logisticsRecordRepository;
    private final InspectionRecordRepository inspectionRecordRepository;

    public TraceResponse getFullTraceByBatchNo(String batchNo) {
        List<Batch> lineageBatches = new ArrayList<>();
        List<BatchLineage> lineageEdges = new ArrayList<>();

        String cursor = batchNo;
        while (true) {
            Batch current = batchService.getBatchByNo(cursor);
            lineageBatches.add(current);

            BatchLineage parentEdge = batchService.getParentEdge(cursor);
            if (parentEdge == null) break;
            lineageEdges.add(parentEdge);
            cursor = parentEdge.getParentBatchNo();
        }

        Collections.reverse(lineageBatches);
        Collections.reverse(lineageEdges);

        Batch batch = lineageBatches.get(lineageBatches.size() - 1);
        String rootBatchNo = lineageBatches.get(0).getBatchNo();
        List<String> batchNosInChain = lineageBatches.stream().map(Batch::getBatchNo).toList();

        return TraceResponse.builder()
                .batch(batch)
                .lineageBatches(lineageBatches)
                .lineageEdges(lineageEdges)
                .plantingRecords(plantingRecordRepository.findAllByBatchNo(rootBatchNo))
                .processingRecords(processingRecordRepository.findAllByBatchNoIn(batchNosInChain))
                .logisticsRecords(logisticsRecordRepository.findAllByBatchNo(batchNo))
                .inspectionRecords(inspectionRecordRepository.findAllByBatchNo(batchNo))
                .build();
    }
}
