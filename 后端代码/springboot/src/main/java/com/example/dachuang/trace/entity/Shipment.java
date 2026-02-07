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
@Table(name = "shipments")
public class Shipment extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String shipmentNo;

    @Column(nullable = false)
    private String batchNo; // leaf batchNo

    @Column(nullable = false)
    private String distributorName; // receiver / distributor

    private String carrier;
    private String trackingNo;
    private String status; // CREATED/IN_TRANSIT/DELIVERED/CANCELLED

    @Column(length = 1000)
    private String remarks;
}

