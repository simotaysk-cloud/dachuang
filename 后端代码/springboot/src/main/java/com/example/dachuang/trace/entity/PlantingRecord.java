package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import jakarta.persistence.Index;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

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
    private String fieldName;
    @Column(length = 64)
    private String operation;
    @Column(length = 1000)
    private String details;
    @Column(length = 64)
    private String operator;

    @Column(length = 255)
    private String imageUrl;
    @Column(length = 255)
    private String audioUrl;

    private Double latitude;
    private Double longitude;

    @Column(name = "operation_time", nullable = false)
    private LocalDateTime operationTime;
}
