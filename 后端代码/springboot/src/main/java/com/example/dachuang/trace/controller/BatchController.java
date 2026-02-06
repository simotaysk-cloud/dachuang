package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.service.BatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/batches")
@RequiredArgsConstructor
public class BatchController {

    private final BatchService batchService;

    @GetMapping
    public Result<List<Batch>> getAll() {
        return Result.success(batchService.getAllBatches());
    }

    @GetMapping("/{batchNo}")
    public Result<Batch> getByNo(@PathVariable String batchNo) {
        return Result.success(batchService.getBatchByNo(batchNo));
    }

    @PostMapping
    public Result<Batch> create(@RequestBody Batch batch) {
        return Result.success(batchService.createBatch(batch));
    }

    @PutMapping("/{id}")
    public Result<Batch> update(@PathVariable Long id, @RequestBody Batch batch) {
        return Result.success(batchService.updateBatch(id, batch));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        batchService.deleteBatch(id);
        return Result.success(null);
    }
}
