package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.entity.ProcessingRecord;
import com.example.dachuang.trace.service.ProcessingRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/processing")
@RequiredArgsConstructor
public class ProcessingRecordController {

    private final ProcessingRecordService processingRecordService;

    @GetMapping
    public Result<List<ProcessingRecord>> list(
            @RequestParam(required = false) String batchNo,
            @RequestParam(required = false) String parentBatchNo
    ) {
        return Result.success(processingRecordService.list(batchNo, parentBatchNo));
    }

    @GetMapping("/{id}")
    public Result<ProcessingRecord> getById(@PathVariable Long id) {
        return Result.success(processingRecordService.getById(id));
    }

    @PostMapping
    public Result<ProcessingRecord> create(@Valid @RequestBody ProcessingRecord record) {
        return Result.success(processingRecordService.create(record));
    }

    @PutMapping("/{id}")
    public Result<ProcessingRecord> update(@PathVariable Long id, @RequestBody ProcessingRecord record) {
        return Result.success(processingRecordService.update(id, record));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        processingRecordService.delete(id);
        return Result.success(null);
    }
}
