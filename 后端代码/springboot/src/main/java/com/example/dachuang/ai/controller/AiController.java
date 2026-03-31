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
@CrossOrigin(origins = "*") // 允许小程序跨域调用
public class AiController {

    @Value("${ai.compat.api-key:}")
    private String compatApiKey;

    @Value("${ai.compat.base-url:}")
    private String compatBaseUrl;

    @Value("${ai.compat.model:}")
    private String compatModelName;

    @Value("${ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${ai.openai.base-url:}")
    private String openAiBaseUrl;

    @Value("${ai.openai.model:}")
    private String openAiModelName;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static final String BASE_PROMPT = "你是一名儒雅、专业的“首席数字中医顾问”云医生。请遵循“理-法-方-药”逻辑为用户提供建议：\n" +
            "1. 优先识别用户是想问症状调理、日常养生、配伍建议还是当前扫码药材的使用注意。\n" +
            "2. 如果已提供批次溯源上下文，必须结合该药材名称、产地、批次状态来回答，不要脱离当前药材泛泛而谈。\n" +
            "3. 输出内容应优先包含：适用场景、常见搭配、食养建议、注意事项、禁忌提醒。\n" +
            "4. 禁止将建议表述成明确医疗诊断；涉及孕期、慢病、儿童、老年人、长期服药时，要提示咨询医生或药师。\n" +
            "5. 语气温润克制，直接输出中文，避免空泛宣传。";

    private String buildSystemPrompt(AiChatRequest request) {
        StringBuilder prompt = new StringBuilder(BASE_PROMPT);

        if (request.getTraceContext() != null) {
            AiTraceContext ctx = request.getTraceContext();
            prompt.append("\n\n当前扫码上下文：");
            if (ctx.getName() != null && !ctx.getName().isBlank()) {
                prompt.append("\n- 药材名称：").append(ctx.getName());
            }
            if (ctx.getBatchNo() != null && !ctx.getBatchNo().isBlank()) {
                prompt.append("\n- 批次号：").append(ctx.getBatchNo());
            }
            if (ctx.getOrigin() != null && !ctx.getOrigin().isBlank()) {
                prompt.append("\n- 原产区：").append(ctx.getOrigin());
            }
            if (ctx.getCategory() != null && !ctx.getCategory().isBlank()) {
                prompt.append("\n- 品类：").append(ctx.getCategory());
            }
            if (ctx.getProductionDate() != null && !ctx.getProductionDate().isBlank()) {
                prompt.append("\n- 生产日期：").append(ctx.getProductionDate());
            }
            if (ctx.getCurrentStatus() != null && !ctx.getCurrentStatus().isBlank()) {
                prompt.append("\n- 当前状态：").append(ctx.getCurrentStatus());
            }
            if (ctx.getLatestNodeTitle() != null && !ctx.getLatestNodeTitle().isBlank()) {
                prompt.append("\n- 最近节点：").append(ctx.getLatestNodeTitle());
            }
            if (ctx.getRecordCount() != null) {
                prompt.append("\n- 链上记录数：").append(ctx.getRecordCount());
            }
            prompt.append("\n请把回答建立在这味药材和当前批次之上。");
        }

        return prompt.toString();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    @PostMapping(value = "/chat/stream", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter chatStream(@RequestBody AiChatRequest request) {
        SseEmitter emitter = new SseEmitter(240000L); // 4分钟超时

        executor.execute(() -> {
            try {
                String apiKey = firstNonBlank(compatApiKey, openAiApiKey);
                String baseUrl = firstNonBlank(compatBaseUrl, openAiBaseUrl);
                String modelName = firstNonBlank(compatModelName, openAiModelName);

                if (apiKey.isBlank() || baseUrl.isBlank() || modelName.isBlank()) {
                    throw new IllegalStateException("AI configuration incomplete: apiKey/baseUrl/model is missing");
                }

                List<Map<String, String>> messages = new ArrayList<>();
                messages.add(Map.of("role", "system", "content", buildSystemPrompt(request)));
                
                if (request.getMessages() != null) {
                    for (AiChatMessage msg : request.getMessages()) {
                        messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
                    }
                }

                Map<String, Object> reqBody = new HashMap<>();
                reqBody.put("model", modelName);
                reqBody.put("messages", messages);
                reqBody.put("stream", false); // 关闭流式，解决中文字符切分乱码问题
                reqBody.put("temperature", 0.75);

                String jsonBody = objectMapper.writeValueAsString(reqBody);

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(baseUrl + "/chat/completions"))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                String body = response.body();
                
                System.out.println("DEBUG AI RESPONSE: " + body);

                JsonNode root = objectMapper.readTree(body);
                String fullContent = root.path("choices").get(0).path("message").path("content").asText();
                
                if (fullContent != null && !fullContent.isEmpty()) {
                    Map<String, String> res = new HashMap<>();
                    res.put("content", fullContent);
                    emitter.send(SseEmitter.event().data(res, MediaType.APPLICATION_JSON));
                }
                
                emitter.send(SseEmitter.event().data("[DONE]"));
                emitter.complete();
            } catch (Exception e) {
                System.err.println("AI Error: " + e.getMessage());
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }
}
