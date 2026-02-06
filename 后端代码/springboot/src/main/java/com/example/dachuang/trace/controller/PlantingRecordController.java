package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.entity.PlantingRecord;
import com.example.dachuang.trace.service.PlantingRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/planting")
@RequiredArgsConstructor
public class PlantingRecordController {

    private final PlantingRecordService plantingRecordService;

    @GetMapping
    public Result<List<PlantingRecord>> list(@RequestParam(required = false) String batchNo) {
        return Result.success(plantingRecordService.list(batchNo));
    }

    @PostMapping
    public Result<PlantingRecord> create(@RequestBody PlantingRecord record) {
        return Result.success(plantingRecordService.create(record));
    }

    @PutMapping("/{id}")
    public Result<PlantingRecord> update(@PathVariable Long id, @RequestBody PlantingRecord record) {
        return Result.success(plantingRecordService.update(id, record));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        plantingRecordService.delete(id);
        return Result.success(null);
    }
}
