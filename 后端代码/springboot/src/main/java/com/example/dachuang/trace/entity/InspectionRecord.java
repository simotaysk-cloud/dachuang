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
        name = "inspection_records",
        indexes = {
                @Index(name = "idx_inspection_batch_no", columnList = "batch_no")
        }
)
public class InspectionRecord extends BaseEntity {
    @Column(nullable = false, length = 64)
    @NotBlank(message = "batchNo cannot be blank")
    private String batchNo;
    @Column(nullable = false, length = 64)
    @NotBlank(message = "result cannot be blank")
    private String result; // 合格、不合格
    @Column(length = 255)
    private String reportUrl; // 质检报告链接
    @Column(length = 64)
    private String inspector; // 质检员
}
