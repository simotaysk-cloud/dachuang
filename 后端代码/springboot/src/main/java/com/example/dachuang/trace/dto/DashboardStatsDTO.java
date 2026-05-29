package com.example.dachuang.trace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private long totalHerbTypes;
    private long totalBatches;
    private long totalRootBatches;
    private long totalLeafBatches;
    private long totalTerminalQrcodes;
    private long totalProcessingRecords;
    private long totalShipments;
    private long totalShipmentEvents;
    private List<Map<String, Object>> originDist;
    private List<Map<String, Object>> processTypeDist;


    private Map<String, Long> integrityStats;
    private List<Map<String, Object>> recentBlockchainRecords;
    private double overallTraceabilityRate;
}
