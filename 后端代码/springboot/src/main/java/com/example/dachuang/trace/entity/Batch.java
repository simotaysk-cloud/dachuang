package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import java.math.BigDecimal;
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

    @Column(name = "owner_user_id")
    private Long ownerUserId; // 所属用户ID（批次创建/归属）

    @Column(unique = true, nullable = false, length = 64)
    private String batchNo; // 批次号（业务主键）

    @Column(nullable = false, unique = true, length = 64)
    private String minCode; // 隐形码（防伪校验）

    @Column(length = 128)
    private String name; // 中药材名称
    @Column(length = 64)
    private String category; // 类别（如：灵芝、当归）
    @Column(length = 128)
    private String origin; // 产地
    @Column(length = 32)
    private String status; // 状态（如：PLANTING, PROCESSING, FINISHED）

    @Column(length = 1000)
    private String description;

    // Inventory & GS1
    @Column(precision = 19, scale = 6)
    private BigDecimal quantity; // 数量
    @Column(length = 16)
    private String unit; // 单位 (kg, g, ton, etc.)

    @Column(name = "gs1_lot_no", unique = true, length = 32)
    private String gs1LotNo; // GS1 AI(10) Lot/Batch (<= 20 chars, unique in our system)

    @Column(name = "gs1_code", unique = true, length = 128)
    private String gs1Code; // GS1-128 HRI: (01)...(10)...(310x)...

    @Column(name = "gs1_locked", nullable = false)
    private boolean gs1Locked; // after printing/applying, prevent changes to GS1-related fields
}
