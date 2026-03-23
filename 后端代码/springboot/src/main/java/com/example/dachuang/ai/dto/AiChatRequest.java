package com.example.dachuang.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class AiChatRequest {
    private List<AiChatMessage> messages;
}
