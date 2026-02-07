package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import jakarta.persistence.Index;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "processing_records",
        indexes = {
                @Index(name = "idx_processing_batch_no", columnList = "batch_no"),
                @Index(name = "idx_processing_parent_batch_no", columnList = "parent_batch_no")
        }
)
public class ProcessingRecord extends BaseEntity {
    @NotBlank(message = "batchNo cannot be blank")
    private String batchNo;
    private String parentBatchNo; // 原料/上游批次号（分叉时填写）
    private String processType; // 加工工艺
    private String factory; // 工厂名称
    private String details;
    private String operator;

    private String imageUrl; // 加工现场/成品照片
}
