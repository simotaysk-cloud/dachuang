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
@Table(name = "planting_records")
public class PlantingRecord extends BaseEntity {
    private String batchNo;
    private String fieldName; // 地块名称
    private String operation; // 操作类型（施肥、灌溉、采收）
    private String details; // 详情
    private String operator; // 操作员

    private String imageUrl; // 现场照片
    private String audioUrl; // 语音录入
}
