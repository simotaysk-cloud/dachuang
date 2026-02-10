package com.example.dachuang.trace.controller;

import com.example.dachuang.blockchain.BlockchainRecord;
import com.example.dachuang.blockchain.BlockchainRecordRepository;
import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.dto.DashboardStatsDTO;
import com.example.dachuang.trace.repository.BatchRepository;
import com.example.dachuang.trace.repository.InspectionRecordRepository;
import com.example.dachuang.trace.repository.PlantingRecordRepository;
import com.example.dachuang.trace.repository.ProcessingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final BatchRepository batchRepository;
    private final ProcessingRecordRepository processingRecordRepository;
    private final PlantingRecordRepository plantingRecordRepository;
    private final InspectionRecordRepository inspectionRecordRepository;
    private final BlockchainRecordRepository blockchainRecordRepository;

    @GetMapping("/stats")
    public Result<DashboardStatsDTO> getStats() {
        long batchCount = batchRepository.count();
        long inspectionCount = inspectionRecordRepository.count();

        Map<String, Long> integrity = new HashMap<>();
        integrity.put("planting", plantingRecordRepository.count());
        integrity.put("processing", processingRecordRepository.count());
        integrity.put("inspection", inspectionCount);
        integrity.put("blockchain", blockchainRecordRepository.count());

        List<BlockchainRecord> recs = blockchainRecordRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();

        List<Map<String, Object>> recentBlockchain = recs.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("batchNo", r.getBatchNo());
            m.put("txHash", r.getTxHash());
            m.put("time", r.getCreatedAt());
            m.put("url", r.getTxUrl());
            return m;
        }).collect(Collectors.toList());

        DashboardStatsDTO stats = DashboardStatsDTO.builder()
                .totalHerbTypes(batchRepository.countDistinctHerbNames())
                .totalBatches(batchCount)
                .totalProcessingRecords(processingRecordRepository.count())
                .originDist(batchRepository.countByOrigin())
                .processTypeDist(processingRecordRepository.countByProcessType())
                .integrityStats(integrity)
                .recentBlockchainRecords(recentBlockchain)
                .overallTraceabilityRate(batchCount == 0 ? 0 : (double) inspectionCount / batchCount * 100)
                .build();
        return Result.success(stats);
    }
}
