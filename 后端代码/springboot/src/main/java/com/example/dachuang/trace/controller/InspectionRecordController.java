package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.dto.InspectionDeriveRequest;
import com.example.dachuang.trace.dto.InspectionDeriveResponse;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.entity.BatchLineage;
import com.example.dachuang.trace.entity.InspectionRecord;
import com.example.dachuang.trace.service.InspectionRecordService;
import com.example.dachuang.trace.service.BatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inspection")
@RequiredArgsConstructor
public class InspectionRecordController {

    private final InspectionRecordService inspectionRecordService;
    private final BatchService batchService;

    @GetMapping
    public Result<List<InspectionRecord>> list(@RequestParam(required = false) String batchNo) {
        return Result.success(inspectionRecordService.list(batchNo));
    }

    @GetMapping("/{id}")
    public Result<InspectionRecord> getById(@PathVariable Long id) {
        return Result.success(inspectionRecordService.getById(id));
    }

    @PostMapping("/derive")
    public Result<InspectionDeriveResponse> derive(@Valid @RequestBody InspectionDeriveRequest request) {
        Batch derived = batchService.deriveBatch(
                request.getParentBatchNo(),
                request.getChildBatchNo(),
                "INSPECTION",
                request.getResult(),
                request.getDetails()
        );

        InspectionRecord record = InspectionRecord.builder()
                .batchNo(derived.getBatchNo())
                .result(request.getResult())
                .reportUrl(request.getReportUrl())
                .inspector(request.getInspector())
                .build();
        InspectionRecord saved = inspectionRecordService.create(record);

        BatchLineage edge = batchService.getParentEdge(derived.getBatchNo());
        return Result.success(InspectionDeriveResponse.builder()
                .derivedBatch(derived)
                .lineageEdge(edge)
                .inspectionRecord(saved)
                .build());
    }

    @PostMapping
    public Result<InspectionRecord> create(@Valid @RequestBody InspectionRecord record) {
        return Result.success(inspectionRecordService.create(record));
    }

    @PutMapping("/{id}")
    public Result<InspectionRecord> update(@PathVariable Long id, @RequestBody InspectionRecord record) {
        throw new BusinessException(409, "Inspection record is immutable once published; create a new record to correct it");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        throw new BusinessException(409, "Inspection record is immutable once published; create a new record to correct it");
    }
}
