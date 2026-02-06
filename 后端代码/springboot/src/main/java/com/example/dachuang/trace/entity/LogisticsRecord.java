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
    private String fromLocation;
    private String toLocation;
    private String status; // 运输中、已送达
    private String trackingNo; // 物流单号
}
