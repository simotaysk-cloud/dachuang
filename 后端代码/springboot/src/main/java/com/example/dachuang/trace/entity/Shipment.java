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
        name = "shipments",
        indexes = {
                @Index(name = "idx_shipments_batch_no", columnList = "batch_no"),
                @Index(name = "idx_shipments_tracking_no", columnList = "tracking_no")
        }
)
public class Shipment extends BaseEntity {

    @Column(nullable = false, unique = true)
    @NotBlank(message = "shipmentNo cannot be blank")
    private String shipmentNo;

    @Column(nullable = false)
    @NotBlank(message = "batchNo cannot be blank")
    private String batchNo; // leaf batchNo

    @Column(nullable = false)
    @NotBlank(message = "distributorName cannot be blank")
    private String distributorName; // receiver / distributor

    private String carrier;
    private String trackingNo;
    private String status; // CREATED/IN_TRANSIT/DELIVERED/CANCELLED

    @Column(length = 1000)
    private String remarks;
}
