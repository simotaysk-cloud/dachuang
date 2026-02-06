package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "logistics_records")
public class LogisticsRecord extends BaseEntity {
    private String batchNo;
    private String fromLocation; // 起点
    private String toLocation; // 终点
    private String trackingNo; // 物流单号

    private String location; // 当前位置
    private String status; // 运输状态
    private String updateTime; // 更新时间
}
