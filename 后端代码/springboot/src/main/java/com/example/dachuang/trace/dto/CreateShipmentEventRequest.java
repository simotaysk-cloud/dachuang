package com.example.dachuang.trace.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateShipmentEventRequest {
    private LocalDateTime eventTime;
    private String location;
    private String status;
    private String details;
}

