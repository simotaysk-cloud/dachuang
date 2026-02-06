package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.entity.InspectionRecord;
import com.example.dachuang.trace.service.InspectionRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inspection")
@RequiredArgsConstructor
public class InspectionRecordController {

    private final InspectionRecordService inspectionRecordService;

    @GetMapping
    public Result<List<InspectionRecord>> list(@RequestParam(required = false) String batchNo) {
        return Result.success(inspectionRecordService.list(batchNo));
    }

    @PostMapping
    public Result<InspectionRecord> create(@RequestBody InspectionRecord record) {
        return Result.success(inspectionRecordService.create(record));
    }

    @PutMapping("/{id}")
    public Result<InspectionRecord> update(@PathVariable Long id, @RequestBody InspectionRecord record) {
        return Result.success(inspectionRecordService.update(id, record));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        inspectionRecordService.delete(id);
        return Result.success(null);
    }
}
