package com.example.dachuang.blockchain;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/blockchain")
@RequiredArgsConstructor
public class BlockchainController {

    private final BlockchainService blockchainService;

    @PostMapping("/record")
    public Result<Map<String, String>> record(@RequestBody Map<String, String> body) {
        String batchNo = body.get("batchNo");
        if (batchNo == null || batchNo.isBlank()) {
            throw new BusinessException(400, "batchNo is required");
        }
        String data = body.getOrDefault("data", "");
        BlockchainService.RecordResult r = blockchainService.recordOnChain(batchNo, data);
        return Result.success(Map.of(
                "mode", r.mode(),
                "txHash", r.txHash(),
                "txUrl", r.txUrl(),
                "dataHash", r.dataHash()
        ));
    }

    @GetMapping("/{batchNo}")
    public Result<BlockchainRecord> get(@PathVariable String batchNo) {
        return Result.success(blockchainService.getRecord(batchNo));
    }
}
