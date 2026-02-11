package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.util.UriUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

    private final QrCodeService qrCodeService;

    @GetMapping("/qr-code/{batchNo}")
    public Result<String> getQrCode(@PathVariable String batchNo, HttpServletRequest request) {
        log.info("Generating public QR code for batch: {}", batchNo);
        String baseUrl = resolveBaseUrl(request);
        String encodedBatchNo = UriUtils.encode(batchNo, StandardCharsets.UTF_8);
        String content = baseUrl + "/demo/trace.html?batchNo=" + encodedBatchNo;

        String base64 = qrCodeService.generateQrCodeBase64(content, 300, 300);
        return Result.success(base64);
    }

    @GetMapping("/ping")
    public Result<String> ping() {
        return Result.success("pong");
    }

    private String resolveBaseUrl(HttpServletRequest request) {
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        String forwardedPort = request.getHeader("X-Forwarded-Port");

        String scheme = (forwardedProto != null && !forwardedProto.isBlank())
                ? forwardedProto
                : request.getScheme();
        String host = (forwardedHost != null && !forwardedHost.isBlank())
                ? forwardedHost
                : request.getServerName();
        int port = request.getServerPort();
        if (forwardedPort != null && !forwardedPort.isBlank()) {
            try {
                port = Integer.parseInt(forwardedPort);
            } catch (NumberFormatException ignore) {
            }
        }

        if (host.contains(":")) {
            return scheme + "://" + host;
        }
        if (("http".equalsIgnoreCase(scheme) && port == 80)
                || ("https".equalsIgnoreCase(scheme) && port == 443)) {
            return scheme + "://" + host;
        }
        return scheme + "://" + host + ":" + port;
    }
}
