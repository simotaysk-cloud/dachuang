package com.example.dachuang.trace.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LogisticsWebhookDTO {
    private String trackingNo;
    private String carrier;
    private String status;
    private String location;
    private String latitude;
    private String longitude;
    private String details;
    private LocalDateTime eventTime;
}
