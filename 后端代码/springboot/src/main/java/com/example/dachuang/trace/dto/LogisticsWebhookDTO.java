package com.example.dachuang.trace.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LogisticsWebhookDTO {
    private String trackingNo; // Courier tracking number
    private String carrier; // Optional: carrier identifier
    private String status; // e.g., IN_TRANSIT, DELIVERED
    private String location; // Current location text
    private String latitude; // Geo coordinate
    private String longitude; // Geo coordinate
    private String details; // Detailed description of the event
    private LocalDateTime eventTime; // When the event occurred
}
