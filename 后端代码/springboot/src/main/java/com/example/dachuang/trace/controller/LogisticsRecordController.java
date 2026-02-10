package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.entity.LogisticsRecord;
import com.example.dachuang.trace.service.LogisticsRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/logistics")
@RequiredArgsConstructor
public class LogisticsRecordController {

    private final LogisticsRecordService logisticsRecordService;

    @GetMapping
    public Result<List<LogisticsRecord>> list(@RequestParam(required = false) String batchNo) {
        return Result.success(logisticsRecordService.list(batchNo));
    }

    @PostMapping
    public Result<LogisticsRecord> create(@Valid @RequestBody LogisticsRecord record) {
        return Result.success(logisticsRecordService.create(record));
    }

    @PutMapping("/{id}")
    public Result<LogisticsRecord> update(@PathVariable Long id, @RequestBody LogisticsRecord record) {
        return Result.success(logisticsRecordService.update(id, record));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        logisticsRecordService.delete(id);
        return Result.success(null);
    }
}
