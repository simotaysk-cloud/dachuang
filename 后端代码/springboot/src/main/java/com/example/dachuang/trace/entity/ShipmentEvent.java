package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "shipment_events")
public class ShipmentEvent extends BaseEntity {

    @Column(nullable = false)
    private String shipmentNo;

    private LocalDateTime eventTime;
    private String location;
    private String status;

    @Column(length = 1000)
    private String details;
}

