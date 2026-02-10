package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.dto.LogisticsWebhookDTO;
import com.example.dachuang.trace.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/public/logistics")
@RequiredArgsConstructor
public class LogisticsWebhookController {

    private final ShipmentService shipmentService;

    /**
     * Callback endpoint for external logistics providers.
     * In a production environment, this should be secured with an API Key or
     * Signature.
     */
    @PostMapping("/callback")
    public Result<Void> handleLogisticsCallback(@RequestBody LogisticsWebhookDTO callback) {
        log.info("Received logistics callback for trackingNo: {}", callback.getTrackingNo());
        shipmentService.handleWebhook(callback);
        return Result.success(null);
    }
}
