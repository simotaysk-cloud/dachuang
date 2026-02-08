package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import jakarta.persistence.Index;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "planting_records",
        indexes = {
                @Index(name = "idx_planting_batch_no", columnList = "batch_no")
        }
)
public class PlantingRecord extends BaseEntity {
    @Column(nullable = false, length = 64)
    @NotBlank(message = "batchNo cannot be blank")
    private String batchNo;
    @Column(length = 128)
    private String fieldName; // 地块名称
    @Column(length = 64)
    private String operation; // 操作类型（施肥、灌溉、采收）
    @Column(length = 1000)
    private String details; // 详情
    @Column(length = 64)
    private String operator; // 操作员

    @Column(length = 255)
    private String imageUrl; // 现场照片
    @Column(length = 255)
    private String audioUrl; // 语音录入

    private Double latitude; // 定位纬度
    private Double longitude; // 定位经度
}
