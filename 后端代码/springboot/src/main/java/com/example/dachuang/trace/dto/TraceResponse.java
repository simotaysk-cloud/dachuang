package com.example.dachuang.trace.dto;

import com.example.dachuang.trace.entity.*;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class TraceResponse {
    private Batch batch;
    private List<Batch> lineageBatches; // root -> current
    private List<BatchLineage> lineageEdges; // root -> current
    private List<PlantingRecord> plantingRecords;
    private List<ProcessingRecord> processingRecords;
    private List<LogisticsRecord> logisticsRecords;
    private List<InspectionRecord> inspectionRecords;
    private List<ShipmentWithEvents> shipmentsWithEvents;
}
