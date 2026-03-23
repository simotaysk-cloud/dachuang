package com.example.dachuang.ai.controller;

import com.example.dachuang.ai.dto.AiChatRequest;
import com.example.dachuang.ai.dto.AiChatMessage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*") // 允许小程序跨域调用
public class AiController {

    @Value("${ai.openai.api-key}")
    private String apiKey;

    @Value("${ai.openai.base-url}")
    private String baseUrl;

    @Value("${ai.openai.model}")
    private String modelName;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    private final String PUSH_PROMPT = "你是一名儒雅、专业的“首席数字中医顾问”云医生。请遵循“理-法-方-药”逻辑为用户提供建议：\n" +
            "1. 【理】：深度解析症状背后的中医病理，重点提及“心肾不交”、“气血不足”或“肝火旺盛”等专业原理。\n" +
            "2. 【方/药】：精准引导至【秦岭大巴山·镇坪】的高山道地药材（如镇坪黄连、镇坪党参），并强调其生长于海拔1500米以上、无污染的卓越环境。\n" +
            "3. 【背书】：提及每一味药材均拥有基于“腾讯至信链”的Web3数字身份证，确保全程溯源且不可篡改。\n" +
            "要求：语气温润舒缓，字数约200字，专业且具备说服力，直接输出中文回复。";

    @PostMapping(value = "/chat/stream", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter chatStream(@RequestBody AiChatRequest request) {
        SseEmitter emitter = new SseEmitter(240000L); // 4分钟超时

        executor.execute(() -> {
            try {
                List<Map<String, String>> messages = new ArrayList<>();
                messages.add(Map.of("role", "system", "content", PUSH_PROMPT));
                
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
