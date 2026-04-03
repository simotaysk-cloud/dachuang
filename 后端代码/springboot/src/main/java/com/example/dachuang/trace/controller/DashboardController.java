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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.example.dachuang.trace.dto.DashboardForecastDTO;

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

    @GetMapping("/herbs")
    public Result<List<String>> getHerbs() {
        return Result.success(batchRepository.findDistinctHerbNames());
    }

    @GetMapping("/forecast")
    public Result<DashboardForecastDTO> getForecast(@org.springframework.web.bind.annotation.RequestParam(required = false) String herb) {
        // Mocking an ARIMA/LSTM time-series prediction output
        List<String> dates = new ArrayList<>();
        List<Double> actual = new ArrayList<>();
        List<Double> predicted = new ArrayList<>();
        List<Double> lower = new ArrayList<>();
        List<Double> upper = new ArrayList<>();

        LocalDate now = LocalDate.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");

        // 如果指定了具体药材，数值范围缩小（代表单一品种）
        double baseVal = (herb == null || herb.isEmpty()) ? 1000.0 : 200.0;
        double trendFactor = (herb == null || herb.isEmpty()) ? 150.0 : 30.0;

        // 过去7个月的实际数据
        for (int i = 7; i > 0; i--) {
            dates.add(now.minusMonths(i).format(fmt));
            actual.add(Math.round((baseVal + Math.random() * (baseVal/2)) * 100.0) / 100.0);
            predicted.add(null);
            lower.add(null);
            upper.add(null);
        }

        // 当前月作为连接点
        double currentVal = Math.round((baseVal * 1.2 + Math.random() * (baseVal/5)) * 100.0) / 100.0;
        dates.add(now.format(fmt));
        actual.add(currentVal);
        predicted.add(currentVal);
        lower.add(currentVal);
        upper.add(currentVal);

        // 未来3个月的预测数据
        for (int i = 1; i <= 3; i++) {
            dates.add(now.plusMonths(i).format(fmt));
            actual.add(null);
            
            double pred = Math.round((currentVal + (i * trendFactor) + (Math.random() * (trendFactor/2))) * 100.0) / 100.0;
            predicted.add(pred);
            lower.add(Math.round(pred * 0.9 * 100.0) / 100.0);
            upper.add(Math.round(pred * 1.1 * 100.0) / 100.0);
        }

        DashboardForecastDTO dto = DashboardForecastDTO.builder()
                .dates(dates)
                .actualValues(actual)
                .predictedValues(predicted)
                .lowerConfidenceBounds(lower)
                .upperConfidenceBounds(upper)
                .modelRmse(herb == null ? 42.15 : 8.43)
                .modelAccuracy(herb == null ? 0.956 : 0.978)
                .build();

        return Result.success(dto);
    }
}
