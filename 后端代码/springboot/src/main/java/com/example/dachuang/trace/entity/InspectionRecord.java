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
@Table(name = "inspection_records")
public class InspectionRecord extends BaseEntity {
    private String batchNo;
    private String result; // 合格、不合格
    private String reportUrl; // 质检报告链接
    private String inspector; // 质检员
}
