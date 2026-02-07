package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
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
        name = "batch_lineages",
        indexes = {
                @Index(name = "idx_lineage_parent_batch_no", columnList = "parent_batch_no")
        }
)
public class BatchLineage extends BaseEntity {

    @Column(nullable = false, length = 64)
    @NotBlank(message = "parentBatchNo cannot be blank")
    private String parentBatchNo;

    @Column(nullable = false, unique = true, length = 64)
    @NotBlank(message = "childBatchNo cannot be blank")
    private String childBatchNo;

    @Column(length = 32)
    private String stage; // e.g. PROCESSING
    @Column(length = 64)
    private String processType; // optional detail of divergence reason

    @Column(length = 1000)
    private String details;
}
