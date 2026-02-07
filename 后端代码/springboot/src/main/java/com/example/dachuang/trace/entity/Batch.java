package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "batches")
public class Batch extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String batchNo; // 批次号（业务主键）

    @Column(nullable = false)
    private String minCode; // 隐形码（防伪校验）

    private String name; // 中药材名称
    private String category; // 类别（如：灵芝、当归）
    private String origin; // 产地
    private String status; // 状态（如：PLANTING, PROCESSING, FINISHED）

    @Column(length = 1000)
    private String description;

    // Inventory & GS1
    private Double quantity; // 数量
    private String unit; // 单位 (kg, g, ton, etc.)

    @Column(unique = true)
    private String gs1LotNo; // GS1 AI(10) Lot/Batch (<= 20 chars, unique in our system)

    @Column(unique = true)
    private String gs1Code; // GS1-128 HRI: (01)...(10)...(310x)...

    private Boolean gs1Locked; // after printing/applying, prevent changes to GS1-related fields
}
