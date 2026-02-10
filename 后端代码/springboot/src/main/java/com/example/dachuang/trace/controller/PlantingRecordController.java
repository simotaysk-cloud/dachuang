package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.entity.PlantingRecord;
import com.example.dachuang.trace.service.PlantingRecordService;
import jakarta.validation.Valid;
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

    @GetMapping("/{id}")
    public Result<PlantingRecord> getById(@PathVariable Long id) {
        return Result.success(plantingRecordService.getById(id));
    }

    @PostMapping
    public Result<PlantingRecord> create(@Valid @RequestBody PlantingRecord record) {
        return Result.success(plantingRecordService.create(record));
    }

    @PutMapping("/{id}")
    public Result<PlantingRecord> update(@PathVariable Long id, @RequestBody PlantingRecord record) {
        throw new BusinessException(409, "Planting record is immutable once published; create a new record to correct it");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        throw new BusinessException(409, "Planting record is immutable once published; create a new record to correct it");
    }
}
