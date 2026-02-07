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
@Table(name = "batch_lineages")
public class BatchLineage extends BaseEntity {

    @Column(nullable = false)
    private String parentBatchNo;

    @Column(nullable = false, unique = true)
    private String childBatchNo;

    private String stage; // e.g. PROCESSING
    private String processType; // optional detail of divergence reason

    @Column(length = 1000)
    private String details;
}

