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
    private long totalProcessingRecords;
    private List<Map<String, Object>> originDist;
    private List<Map<String, Object>> processTypeDist;

    // Traceability Statistics
    private Map<String, Long> integrityStats; // {planting: 10, processing: 8, inspection: 5, blockchain: 3}
    private List<Map<String, Object>> recentBlockchainRecords; // Recent tx summaries
    private double overallTraceabilityRate; // Percent of batches with inspection
}
