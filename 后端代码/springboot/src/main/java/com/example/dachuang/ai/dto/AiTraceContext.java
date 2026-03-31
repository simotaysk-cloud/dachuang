package com.example.dachuang.ai.dto;

import lombok.Data;

@Data
public class AiTraceContext {
    private String source;
    private String batchNo;
    private String name;
    private String origin;
    private String category;
    private String productionDate;
    private Integer recordCount;
    private String currentStatus;
    private String latestNodeTitle;
}
