package com.example.dachuang.trace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateShipmentEventRequest {
    private LocalDateTime eventTime;

    @NotBlank(message = "location cannot be blank")
    private String location;

    @NotBlank(message = "status cannot be blank")
    private String status;
    private String latitude;
    private String longitude;
    private String details;
}
