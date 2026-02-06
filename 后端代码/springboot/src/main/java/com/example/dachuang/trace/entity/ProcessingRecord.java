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
@Table(name = "processing_records")
public class ProcessingRecord extends BaseEntity {
    private String batchNo;
    private String processType; // 加工工艺
    private String factory; // 工厂名称
    private String details;
    private String operator;

    private String imageUrl; // 加工现场/成品照片
}
