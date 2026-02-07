package com.example.dachuang.trace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateShipmentRequest {
    @NotBlank(message = "batchNo cannot be blank")
    private String batchNo;

    @NotBlank(message = "distributorName cannot be blank")
    private String distributorName;

    private String carrier;
    private String trackingNo;
    private String remarks;
}

