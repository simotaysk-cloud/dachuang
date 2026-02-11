package com.example.dachuang.trace.controller;

import com.example.dachuang.blockchain.BlockchainRecord;
import com.example.dachuang.blockchain.BlockchainRecordRepository;
import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.dto.DashboardStatsDTO;
import com.example.dachuang.trace.repository.BatchRepository;
import com.example.dachuang.trace.repository.InspectionRecordRepository;
import com.example.dachuang.trace.repository.PlantingRecordRepository;
import com.example.dachuang.trace.repository.ProcessingRecordRepository;
import com.example.dachuang.trace.repository.ShipmentEventRepository;
import com.example.dachuang.trace.repository.ShipmentRepository;
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
    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository shipmentEventRepository;

    @GetMapping("/stats")
    public Result<DashboardStatsDTO> getStats() {
        long batchCount = batchRepository.count();
        long rootCount = batchRepository.countRootBatches();
        long leafCount = batchRepository.countLeafBatches();
        long inspectionCount = inspectionRecordRepository.count();
        long inspectedLeafCount = inspectionRecordRepository.countDistinctLeafBatchNo();
        long shipmentCount = shipmentRepository.count();
        long shipmentEventCount = shipmentEventRepository.count();

        Map<String, Long> integrity = new HashMap<>();
        integrity.put("planting", plantingRecordRepository.count());
        integrity.put("processing", processingRecordRepository.count());
        integrity.put("inspection", inspectionCount);
        integrity.put("blockchain", blockchainRecordRepository.count());
        integrity.put("terminalQr", leafCount);

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
                .totalRootBatches(rootCount)
                .totalLeafBatches(leafCount)
                .totalTerminalQrcodes(leafCount)
                .totalProcessingRecords(processingRecordRepository.count())
                .totalShipments(shipmentCount)
                .totalShipmentEvents(shipmentEventCount)
                .originDist(batchRepository.countByOrigin())
                .processTypeDist(processingRecordRepository.countByProcessType())
                .integrityStats(integrity)
                .recentBlockchainRecords(recentBlockchain)
                .overallTraceabilityRate(leafCount == 0 ? 0 : (double) inspectedLeafCount / leafCount * 100)
                .build();
        return Result.success(stats);
    }
}
