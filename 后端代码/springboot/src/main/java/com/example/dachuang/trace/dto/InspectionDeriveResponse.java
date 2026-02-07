package com.example.dachuang.trace.dto;

import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.entity.BatchLineage;
import com.example.dachuang.trace.entity.InspectionRecord;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InspectionDeriveResponse {
    private Batch derivedBatch;
    private BatchLineage lineageEdge;
    private InspectionRecord inspectionRecord;
}

