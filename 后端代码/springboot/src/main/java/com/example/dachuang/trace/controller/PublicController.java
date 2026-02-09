package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

    private final QrCodeService qrCodeService;

    @GetMapping("/qr-code/{batchNo}")
    public Result<String> getQrCode(@PathVariable String batchNo, jakarta.servlet.http.HttpServletRequest request) {
        log.info("Generating public QR code for batch: {}", batchNo);
        // Standard URL for universal scanners to open the demo landing page
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();

        // Use the current request's base as the landing page root
        String baseUrl = scheme + "://" + serverName + ":" + serverPort;
        String content = baseUrl + "/demo/trace.html?batchNo=" + batchNo;

        String base64 = qrCodeService.generateQrCodeBase64(content, 300, 300);
        return Result.success(base64);
    }

    @GetMapping("/ping")
    public Result<String> ping() {
        return Result.success("pong");
    }
}
