package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.entity.BatchLineage;
import com.example.dachuang.trace.service.BatchService;
import com.example.dachuang.trace.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/batches")
@RequiredArgsConstructor
public class BatchController {

    private final BatchService batchService;
    private final QrCodeService qrCodeService;

    @GetMapping
    public Result<List<Batch>> getAll() {
        return Result.success(batchService.getAllBatches());
    }

    @GetMapping("/{batchNo}")
    public Result<Batch> getByNo(@PathVariable String batchNo) {
        return Result.success(batchService.getBatchByNo(batchNo));
    }

    @GetMapping("/{batchNo}/qrcode")
    public Result<Map<String, String>> getQrCode(
            @PathVariable String batchNo,
            @RequestParam(defaultValue = "280") int size
    ) {
        Batch b = batchService.getBatchByNo(batchNo);
        int s = Math.max(120, Math.min(size, 1024));
        String base64 = qrCodeService.generateQrCodeBase64(b.getBatchNo(), s, s);
        String src = "data:image/png;base64," + base64;
        return Result.success(Map.of(
                "batchNo", b.getBatchNo(),
                "src", src
        ));
    }

    @PostMapping
    public Result<Batch> create(
            @RequestBody Batch batch,
            @RequestAttribute("username") String username,
            @RequestAttribute("role") String role) {
        return Result.success(batchService.createBatch(batch, username, role));
    }

    @PostMapping("/{parentBatchNo}/derive")
    public Result<Batch> derive(
            @PathVariable String parentBatchNo,
            @RequestParam(required = false) String childBatchNo,
            @RequestParam(required = false) String processType,
            @RequestParam(required = false) String details) {
        return Result
                .success(batchService.deriveBatch(parentBatchNo, childBatchNo, "PROCESSING", processType, details));
    }

    @PostMapping("/{batchNo}/lock-gs1")
    public Result<Batch> lockGs1(@PathVariable String batchNo) {
        return Result.success(batchService.lockGs1ByBatchNo(batchNo));
    }

    @GetMapping("/{parentBatchNo}/children")
    public Result<List<BatchLineage>> children(@PathVariable String parentBatchNo) {
        return Result.success(batchService.getChildren(parentBatchNo));
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
