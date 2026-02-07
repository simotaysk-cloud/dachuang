package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
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
        name = "shipment_events",
        indexes = {
                @Index(name = "idx_shipment_events_ship_no_time", columnList = "shipment_no,event_time")
        }
)
public class ShipmentEvent extends BaseEntity {

    @Column(nullable = false)
    @NotBlank(message = "shipmentNo cannot be blank")
    private String shipmentNo;

    private LocalDateTime eventTime;
    @NotBlank(message = "location cannot be blank")
    private String location;
    @NotBlank(message = "status cannot be blank")
    private String status;

    @Column(length = 1000)
    private String details;
}
