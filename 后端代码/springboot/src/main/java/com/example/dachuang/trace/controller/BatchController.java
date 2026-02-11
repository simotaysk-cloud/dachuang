package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.entity.BatchLineage;
import com.example.dachuang.trace.service.BatchService;
import com.example.dachuang.trace.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.util.UriUtils;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
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
    public Result<List<Batch>> getAll(@RequestParam(defaultValue = "false") boolean rootOnly) {
        return Result.success(batchService.getAllBatches(rootOnly));
    }

    @GetMapping("/{batchNo}")
    public Result<Batch> getByNo(@PathVariable String batchNo) {
        return Result.success(batchService.getBatchByNo(batchNo));
    }

    @GetMapping("/{batchNo}/qrcode")
    public Result<Map<String, String>> getQrCode(
            @PathVariable String batchNo,
            HttpServletRequest request,
            @RequestParam(defaultValue = "280") int size) {
        Batch b = batchService.getBatchByNo(batchNo);
        int s = Math.max(120, Math.min(size, 1024));
        String baseUrl = resolveBaseUrl(request);
        String encodedBatchNo = UriUtils.encode(b.getBatchNo(), StandardCharsets.UTF_8);
        String content = baseUrl + "/demo/trace.html?batchNo=" + encodedBatchNo;
        String base64 = qrCodeService.generateQrCodeBase64(content, s, s);
        String src = "data:image/png;base64," + base64;
        return Result.success(Map.of(
                "batchNo", b.getBatchNo(),
                "src", src));
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
                .success(batchService.deriveBatch(parentBatchNo, childBatchNo, "PROCESSING", processType, details, null,
                        null));
    }

    @PostMapping("/{batchNo}/lock-gs1")
    public Result<Batch> lockGs1(@PathVariable String batchNo) {
        return Result.success(batchService.lockGs1ByBatchNo(batchNo));
    }

    @GetMapping("/{parentBatchNo}/children")
    public Result<List<BatchLineage>> children(@PathVariable String parentBatchNo) {
        return Result.success(batchService.getChildren(parentBatchNo));
    }

    @GetMapping("/leaf-batches")
    public Result<List<Map<String, Object>>> leafBatchesAll(
            @RequestParam(required = false) String rootBatchNo,
            @RequestParam(defaultValue = "200") int limit) {
        int max = Math.max(1, Math.min(limit, 1000));
        List<String> leafNos = resolveLeafBatchNos(rootBatchNo, max);
        return Result.success(buildLeafRows(leafNos));
    }

    @GetMapping("/{batchNo}/leaf-batches")
    public Result<List<Map<String, Object>>> leafBatches(
            @PathVariable String batchNo,
            @RequestParam(defaultValue = "200") int limit) {
        return leafBatchesAll(batchNo, limit);
    }

    @GetMapping("/leaf-qrcodes")
    public Result<List<Map<String, Object>>> leafQrcodesAll(
            HttpServletRequest request,
            @RequestParam(required = false) String rootBatchNo,
            @RequestParam(defaultValue = "280") int size,
            @RequestParam(defaultValue = "200") int limit) {
        int s = Math.max(120, Math.min(size, 1024));
        int max = Math.max(1, Math.min(limit, 1000));
        String baseUrl = resolveBaseUrl(request);
        List<String> leafNos = resolveLeafBatchNos(rootBatchNo, max);
        return Result.success(buildLeafQrRows(leafNos, rootBatchNo, baseUrl, s));
    }

    @GetMapping("/{batchNo}/leaf-qrcodes")
    public Result<List<Map<String, Object>>> leafQrcodes(
            @PathVariable String batchNo,
            HttpServletRequest request,
            @RequestParam(defaultValue = "280") int size,
            @RequestParam(defaultValue = "200") int limit) {
        return leafQrcodesAll(request, batchNo, size, limit);
    }

    @GetMapping("/leaf-qrcodes/export")
    public Result<Map<String, Object>> exportLeafQrcodesAll(
            HttpServletRequest request,
            @RequestParam(required = false) String rootBatchNo,
            @RequestParam(defaultValue = "220") int size,
            @RequestParam(defaultValue = "200") int limit) {
        int s = Math.max(120, Math.min(size, 512));
        int max = Math.max(1, Math.min(limit, 1000));
        String baseUrl = resolveBaseUrl(request);
        List<String> leafNos = resolveLeafBatchNos(rootBatchNo, max);
        List<Map<String, Object>> rows = buildLeafQrRows(leafNos, rootBatchNo, baseUrl, s);

        StringBuilder csv = new StringBuilder();
        csv.append("rootBatchNo,leafBatchNo,name,status,parentBatchNo,stage,processType,lineName,operator,traceUrl,qrDataUrl\n");
        for (Map<String, Object> row : rows) {
            csv.append(csvCell(text(row.get("rootBatchNo")))).append(',')
                    .append(csvCell(text(row.get("batchNo")))).append(',')
                    .append(csvCell(text(row.get("name")))).append(',')
                    .append(csvCell(text(row.get("status")))).append(',')
                    .append(csvCell(text(row.get("parentBatchNo")))).append(',')
                    .append(csvCell(text(row.get("stage")))).append(',')
                    .append(csvCell(text(row.get("processType")))).append(',')
                    .append(csvCell(text(row.get("lineName")))).append(',')
                    .append(csvCell(text(row.get("operator")))).append(',')
                    .append(csvCell(text(row.get("traceUrl")))).append(',')
                    .append(csvCell(text(row.get("src"))))
                    .append('\n');
        }

        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String tag = (rootBatchNo == null || rootBatchNo.isBlank()) ? "all" : rootBatchNo;
        String filename = "leaf-qrcodes-" + tag + "-" + ts + ".csv";
        Map<String, Object> payload = new HashMap<>();
        payload.put("filename", filename);
        payload.put("csv", csv.toString());
        payload.put("count", rows.size());
        return Result.success(payload);
    }

    @GetMapping("/{batchNo}/leaf-qrcodes/export")
    public Result<Map<String, Object>> exportLeafQrcodes(
            @PathVariable String batchNo,
            HttpServletRequest request,
            @RequestParam(defaultValue = "220") int size,
            @RequestParam(defaultValue = "200") int limit) {
        return exportLeafQrcodesAll(request, batchNo, size, limit);
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

    private String csvCell(String v) {
        if (v == null) {
            return "\"\"";
        }
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }

    private String text(Object v) {
        return v == null ? "" : String.valueOf(v);
    }

    private List<String> resolveLeafBatchNos(String rootBatchNo, int max) {
        List<String> leafNos;
        String root = rootBatchNo == null ? "" : rootBatchNo.trim();
        if (root.isBlank()) {
            leafNos = batchService.getAllLeafBatchNos();
        } else {
            leafNos = batchService.getLeafDescendantBatchNos(root);
        }
        if (leafNos.size() > max) {
            return leafNos.subList(0, max);
        }
        return leafNos;
    }

    private List<Map<String, Object>> buildLeafRows(List<String> leafNos) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (String leafNo : leafNos) {
            Batch leaf = batchService.getBatchByNo(leafNo);
            BatchLineage edge = batchService.getParentEdge(leafNo);
            Map<String, Object> row = new HashMap<>();
            row.put("batchNo", leaf.getBatchNo());
            row.put("name", leaf.getName());
            row.put("status", leaf.getStatus());
            row.put("parentBatchNo", edge == null ? "" : edge.getParentBatchNo());
            row.put("stage", edge == null ? "" : edge.getStage());
            row.put("processType", edge == null ? "" : edge.getProcessType());
            row.put("lineName", edge == null ? "" : edge.getLineName());
            row.put("operator", edge == null ? "" : edge.getOperator());
            row.put("details", edge == null ? "" : edge.getDetails());
            rows.add(row);
        }
        return rows;
    }

    private List<Map<String, Object>> buildLeafQrRows(List<String> leafNos, String requestedRoot, String baseUrl, int size) {
        String root = requestedRoot == null ? "" : requestedRoot.trim();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (String leafNo : leafNos) {
            Batch leaf = batchService.getBatchByNo(leafNo);
            BatchLineage edge = batchService.getParentEdge(leafNo);
            String encoded = UriUtils.encode(leafNo, StandardCharsets.UTF_8);
            String traceUrl = baseUrl + "/demo/trace.html?batchNo=" + encoded;
            String src = "data:image/png;base64," + qrCodeService.generateQrCodeBase64(traceUrl, size, size);
            String rootBatchNo = root.isBlank() ? batchService.getRootAncestorBatchNo(leafNo) : root;

            Map<String, Object> row = new HashMap<>();
            row.put("rootBatchNo", rootBatchNo);
            row.put("batchNo", leaf.getBatchNo());
            row.put("name", leaf.getName());
            row.put("status", leaf.getStatus());
            row.put("traceUrl", traceUrl);
            row.put("src", src);
            row.put("parentBatchNo", edge == null ? "" : edge.getParentBatchNo());
            row.put("stage", edge == null ? "" : edge.getStage());
            row.put("processType", edge == null ? "" : edge.getProcessType());
            row.put("lineName", edge == null ? "" : edge.getLineName());
            row.put("operator", edge == null ? "" : edge.getOperator());
            rows.add(row);
        }
        return rows;
    }
}
