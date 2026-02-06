package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.dto.TraceResponse;
import com.example.dachuang.trace.service.TraceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/trace")
@RequiredArgsConstructor
public class TraceController {

    private final TraceService traceService;

    @GetMapping("/{batchNo}")
    public Result<TraceResponse> getTrace(@PathVariable String batchNo) {
        return Result.success(traceService.getFullTraceByBatchNo(batchNo));
    }
}
