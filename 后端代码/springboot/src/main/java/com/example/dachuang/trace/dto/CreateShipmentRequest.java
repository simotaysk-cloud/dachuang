package com.example.dachuang.trace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateShipmentRequest {
    @NotEmpty(message = "items cannot be empty")
    private List<Item> items;

    @NotBlank(message = "distributorName cannot be blank")
    private String distributorName;

    private String carrier;
    private String trackingNo;
    private String remarks;

    @Data
    public static class Item {
        @NotBlank(message = "batchNo cannot be blank")
        private String batchNo;
        private BigDecimal quantity;
        private String unit;
    }
}
