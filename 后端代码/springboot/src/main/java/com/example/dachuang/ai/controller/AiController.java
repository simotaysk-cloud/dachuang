package com.example.dachuang.ai.controller;

import com.example.dachuang.ai.dto.AiChatRequest;
import com.example.dachuang.ai.dto.AiChatMessage;
import com.example.dachuang.ai.dto.AiTraceContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*")
public class AiController {

    @Value("${ai.compat.api-key:}")
    private String compatApiKey;

    @Value("${ai.compat.base-url:}")
    private String compatBaseUrl;

    @Value("${ai.compat.model:}")
    private String compatModelName;

    @Value("${ai.hunyuan.api-key:}")
    private String hunyuanApiKey;

    @Value("${ai.hunyuan.base-url:}")
    private String hunyuanBaseUrl;

    @Value("${ai.hunyuan.model:}")
    private String hunyuanModelName;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static final String BASE_PROMPT = "你是一名儒雅、专业的“首席数字中医顾问”云医生。请遵循“理-法-方-药”逻辑为用户提供建议：\n" +
            "1. 优先识别用户是想问症状调理、日常养生、配伍建议还是当前扫码药材的使用注意。\n" +
            "2. 如果已提供批次溯源上下文，必须结合该药材名称、产地、批次状态来回答，不要脱离当前药材泛泛而谈。\n" +
            "3. 【方/药】：精准引导至【秦岭大巴山·镇坪】的高山道地药材（如镇坪黄连、镇坪党参），并强调其生长于海拔1500米以上、无污染的卓越环境。\n" +
            "4. 输出内容应优先包含：适用场景、常见搭配、食养建议、注意事项、禁忌提醒。\n" +
            "5. 禁止将建议表述成明确医疗诊断；涉及孕期、慢病、儿童、老年人、长期服药时，要提示咨询医生或药师。\n" +
            "6. 语气温润克制，直接输出中文回复。当提供参考依据时，请明确提及'【知识图谱检索命中】'。";

    private String buildSystemPrompt(AiChatRequest request) {
        StringBuilder prompt = new StringBuilder(BASE_PROMPT);
        if (request.getTraceContext() != null) {
            AiTraceContext ctx = request.getTraceContext();
            prompt.append("\n\n当前扫码上下文：");
            if (ctx.getName() != null && !ctx.getName().isBlank()) prompt.append("\n- 药材名称：").append(ctx.getName());
            if (ctx.getBatchNo() != null && !ctx.getBatchNo().isBlank()) prompt.append("\n- 批次号：").append(ctx.getBatchNo());
            if (ctx.getOrigin() != null && !ctx.getOrigin().isBlank()) prompt.append("\n- 原产区：").append(ctx.getOrigin());
            prompt.append("\n请把回答建立在这味药材和当前批次之上。");
        }
        return prompt.toString();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    private String performMockVectorSearch(String userMessage) {
        if (userMessage == null) return "";
        if (userMessage.contains("失眠") || userMessage.contains("睡不着")) {
            return "【知识图谱匹配节点】：黄连->清心火->治心肾不交型失眠。依据：《本草纲目拾遗》。";
        }
        return "【知识图谱匹配节点】：暂无特异匹配，根据基础大模型中医数据库解答。";
    }

    @PostMapping("/chat/sync")
    public Map<String, Object> chatSync(@RequestBody AiChatRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            String apiKey = firstNonBlank(System.getenv("AI_API_KEY"), compatApiKey, hunyuanApiKey);
            String baseUrl = firstNonBlank(compatBaseUrl, hunyuanBaseUrl);
            String modelName = firstNonBlank(compatModelName, hunyuanModelName);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", buildSystemPrompt(request)));
            
            boolean hasUserMsg = false;
            if (request.getMessages() != null && !request.getMessages().isEmpty()) {
                for (AiChatMessage msg : request.getMessages()) {
                    String role = "ai".equalsIgnoreCase(msg.getRole()) ? "assistant" : msg.getRole();
                    messages.add(Map.of("role", role, "content", msg.getContent()));
                    if ("user".equalsIgnoreCase(role)) hasUserMsg = true;
                }
            }

            if (!hasUserMsg) {
                String defaultMsg = "你好，请结合当前上下文为我提供一些专业建议。";
                if (request.getTraceContext() != null && request.getTraceContext().getName() != null) {
                    defaultMsg = "你好，请为我介绍一下这味" + request.getTraceContext().getName() + "。";
                }
                messages.add(Map.of("role", "user", "content", defaultMsg));
            }

            Map<String, Object> reqBody = new HashMap<>();
            reqBody.put("model", modelName);
            reqBody.put("messages", messages);
            reqBody.put("stream", false);

            String jsonBody = objectMapper.writeValueAsString(reqBody);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            String body = response.body();
            JsonNode root = objectMapper.readTree(body);
            
            if (root.has("choices") && root.path("choices").size() > 0) {
                result.put("success", true);
                result.put("content", root.path("choices").get(0).path("message").path("content").asText());
            } else {
                result.put("success", false);
                result.put("error", body);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    @PostMapping(value = "/chat/stream", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter chatStream(@RequestBody AiChatRequest request) {
        SseEmitter emitter = new SseEmitter(240000L);
        executor.execute(() -> {
            try {
                String apiKey = firstNonBlank(System.getenv("AI_API_KEY"), compatApiKey, hunyuanApiKey);
                String baseUrl = firstNonBlank(compatBaseUrl, hunyuanBaseUrl);
                String modelName = firstNonBlank(compatModelName, hunyuanModelName);

                System.out.println("[AI] Starting stream request for model: " + modelName);
                if (apiKey == null || apiKey.isBlank() || apiKey.equals("sk-placeholder")) {
                    System.err.println("[AI] WARNING: AI_API_KEY is empty or placeholder!");
                }

                List<Map<String, String>> messages = new ArrayList<>();
                StringBuilder systemContent = new StringBuilder(buildSystemPrompt(request));
                
                if (request.getMessages() != null && !request.getMessages().isEmpty()) {
                    AiChatMessage lastUserMsg = request.getMessages().get(request.getMessages().size() - 1);
                    String ragContext = performMockVectorSearch(lastUserMsg.getContent());
                    systemContent.append("\n\nRAG上下文：\n").append(ragContext);
                }
                
                messages.add(Map.of("role", "system", "content", systemContent.toString()));
                
                boolean hasUserMsg = false;
                if (request.getMessages() != null && !request.getMessages().isEmpty()) {
                    for (AiChatMessage msg : request.getMessages()) {
                        String role = "ai".equalsIgnoreCase(msg.getRole()) ? "assistant" : msg.getRole();
                        messages.add(Map.of("role", role, "content", msg.getContent()));
                        if ("user".equalsIgnoreCase(role)) hasUserMsg = true;
                    }
                }

                // API requirement: messages list must end with a 'user' message. 
                // If it's empty (e.g. after scan) or ends with assistant, append/ensure user prompt.
                if (!hasUserMsg) {
                    String defaultMsg = "你好，请结合当前上下文为我提供一些专业建议。";
                    if (request.getTraceContext() != null && request.getTraceContext().getName() != null) {
                        defaultMsg = "你好，请为我介绍一下这味" + request.getTraceContext().getName() + "。";
                    }
                    messages.add(Map.of("role", "user", "content", defaultMsg));
                }

                Map<String, Object> reqBody = new HashMap<>();
                reqBody.put("model", modelName);
                reqBody.put("messages", messages);
                reqBody.put("stream", true);

                String jsonBody = objectMapper.writeValueAsString(reqBody);

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(baseUrl + "/chat/completions"))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .build();

                httpClient.sendAsync(httpRequest, HttpResponse.BodyHandlers.ofInputStream())
                        .thenAccept(response -> {
                            int statusCode = response.statusCode();
                            System.out.println("[AI] Received response headers. Status: " + statusCode);
                            
                            if (statusCode >= 400) {
                                try (java.io.InputStream is = response.body();
                                     java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(is, StandardCharsets.UTF_8))) {
                                    StringBuilder errorBody = new StringBuilder();
                                    String line;
                                    while ((line = reader.readLine()) != null) errorBody.append(line);
                                    System.err.println("[AI] ERROR Body from Provider: " + errorBody.toString());
                                } catch (Exception e) {
                                    System.err.println("[AI] Failed to read error body: " + e.getMessage());
                                }
                                emitter.completeWithError(new RuntimeException("AI Provider returned " + statusCode));
                                return;
                            }

                            try (java.io.InputStream is = response.body();
                                 java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(is, StandardCharsets.UTF_8))) {
                                
                                String line;
                                while ((line = reader.readLine()) != null) {
                                    if (line.isBlank()) continue;
                                    
                                    if (line.startsWith("data:")) {
                                        String data = line.substring(line.indexOf(":") + 1).strip();
                                        if ("[DONE]".equals(data)) {
                                            emitter.send(SseEmitter.event().data("[DONE]"));
                                            emitter.complete();
                                            return;
                                        }
                                        
                                        try {
                                            JsonNode node = objectMapper.readTree(data);
                                            JsonNode delta = node.path("choices").get(0).path("delta");
                                            if (delta.has("content")) {
                                                String content = delta.get("content").asText();
                                                System.out.print(content); // Log to backend.log
                                                Map<String, String> res = Map.of("content", content);
                                                emitter.send(SseEmitter.event().data(res, MediaType.APPLICATION_JSON));
                                            }
                                        } catch (Exception e) {
                                            // Handle case where SSE data isn't full JSON or mixed
                                        }
                                    }
                                }
                                emitter.complete();
                            } catch (Exception e) {
                                emitter.completeWithError(e);
                            }
                        })
                        .exceptionally(ex -> {
                            emitter.completeWithError(ex);
                            return null;
                        });
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }
}
