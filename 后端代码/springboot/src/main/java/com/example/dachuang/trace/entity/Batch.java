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
    private String batchNo; // GS1 编码或自定义批次号（明码）

    @Column(nullable = false)
    private String minCode; // 隐形码（防伪校验）

    private String name; // 中药材名称
    private String category; // 类别（如：灵芝、当归）
    private String origin; // 产地
    private String status; // 状态（如：PLANTING, PROCESSING, FINISHED）

    @Column(length = 1000)
    private String description;
}
