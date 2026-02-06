package com.example.dachuang.code;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/code")
@RequiredArgsConstructor
public class CodeController {

    private final CodeService codeService;

    @PostMapping("/generate")
    public Result<Map<String, String>> generate(@RequestBody Map<String, String> body) {
        String batchNo = body.get("batchNo");
        if (batchNo == null || batchNo.isBlank()) {
            throw new BusinessException(400, "batchNo is required");
        }
        return Result.success(codeService.generateDoubleCode(batchNo));
    }

    @PostMapping("/verify")
    public Result<Map<String, Object>> verify(@RequestBody Map<String, String> body) {
        String invisibleCode = body.get("invisibleCode");
        if (invisibleCode == null || invisibleCode.isBlank()) {
            throw new BusinessException(400, "invisibleCode is required");
        }
        boolean valid = codeService.verifyInvisibleCode(invisibleCode);
        return Result.success(Map.of("valid", valid));
    }
}
