package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import jakarta.persistence.Index;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "processing_records", indexes = {
                @Index(name = "idx_processing_batch_no", columnList = "batch_no"),
                @Index(name = "idx_processing_parent_batch_no", columnList = "parent_batch_no")
})
public class ProcessingRecord extends BaseEntity {
        @Column(nullable = false, length = 64)
        private String batchNo;
        @Column(length = 64)
        private String parentBatchNo;
        @Column(length = 64)
        private String processType;
        @Column(length = 64)
        private String lineName;
        @Column(length = 128)
        private String factory;
        @Column(length = 1000)
        private String details;
        @Column(length = 64)
        private String operator;

        @Column(precision = 19, scale = 6)
        private java.math.BigDecimal extractedQuantity;

        @Column(precision = 19, scale = 6)
        private java.math.BigDecimal outputQuantity;

        @Column(length = 255)
        private String imageUrl;
}
