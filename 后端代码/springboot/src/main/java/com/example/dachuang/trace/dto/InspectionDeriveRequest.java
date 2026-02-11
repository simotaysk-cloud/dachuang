package com.example.dachuang.trace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InspectionDeriveRequest {
    @NotBlank(message = "parentBatchNo cannot be blank")
    private String parentBatchNo;

    private String childBatchNo;

    @NotBlank(message = "result cannot be blank")
    private String result;

    private String reportUrl;

    @NotBlank(message = "inspector cannot be blank")
    private String inspector;
    private String details;
}
