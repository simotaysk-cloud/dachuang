package com.example.dachuang.trace.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
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
        name = "logistics_records",
        indexes = {
                @Index(name = "idx_logistics_batch_no", columnList = "batch_no"),
                @Index(name = "idx_logistics_tracking_no", columnList = "tracking_no")
        }
)
public class LogisticsRecord extends BaseEntity {
    @Column(nullable = false, length = 64)
    @NotBlank(message = "batchNo cannot be blank")
    private String batchNo;
    @Column(length = 128)
    private String fromLocation; // 起点
    @Column(length = 128)
    private String toLocation; // 终点
    @Column(length = 64)
    private String trackingNo; // 物流单号

    @Column(length = 128)
    private String location; // 当前位置
    @Column(length = 32)
    private String status; // 运输状态

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime; // 更新时间
}
