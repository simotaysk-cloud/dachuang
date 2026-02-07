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
        name = "logistics_records",
        indexes = {
                @Index(name = "idx_logistics_batch_no", columnList = "batch_no"),
                @Index(name = "idx_logistics_tracking_no", columnList = "tracking_no")
        }
)
public class LogisticsRecord extends BaseEntity {
    @NotBlank(message = "batchNo cannot be blank")
    private String batchNo;
    private String fromLocation; // 起点
    private String toLocation; // 终点
    private String trackingNo; // 物流单号

    private String location; // 当前位置
    private String status; // 运输状态
    private String updateTime; // 更新时间
}
