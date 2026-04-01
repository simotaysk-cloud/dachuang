package com.example.dachuang.trace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardForecastDTO {

    private List<String> dates;
    private List<Double> actualValues;
    private List<Double> predictedValues;
    private List<Double> lowerConfidenceBounds;
    private List<Double> upperConfidenceBounds;
    
    // 供前端展示的模型表现数据指标
    private double modelRmse;
    private double modelAccuracy;
}
