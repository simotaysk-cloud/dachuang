package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "shipment_items", indexes = {
        @Index(name = "idx_shipment_items_shipment_no", columnList = "shipment_no"),
        @Index(name = "idx_shipment_items_batch_no", columnList = "batch_no")
})
public class ShipmentItem extends BaseEntity {

    @Column(nullable = false, length = 64)
    @NotBlank(message = "shipmentNo cannot be blank")
    private String shipmentNo;

    @Column(nullable = false, length = 64)
    @NotBlank(message = "batchNo cannot be blank")
    private String batchNo;

    private BigDecimal quantity;
    private String unit;
}
