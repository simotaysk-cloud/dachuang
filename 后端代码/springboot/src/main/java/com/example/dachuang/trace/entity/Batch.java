package com.example.dachuang.trace.entity;

import com.example.dachuang.common.entity.BaseEntity;
import java.math.BigDecimal;
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
@Table(name = "batches")
public class Batch extends BaseEntity {

    @Column(name = "owner_user_id")
    private Long ownerUserId;

    @Column(unique = true, nullable = false, length = 64)
    private String batchNo;

    @Column(nullable = false, unique = true, length = 64)
    private String minCode;

    @Column(length = 128)
    private String name;
    @Column(length = 64)
    private String category;
    @Column(length = 128)
    private String origin;
    @Column(length = 32)
    private String status;

    @Column(length = 1000)
    private String description;

    @Column(length = 255)
    private String imageUrl;

    @Column(length = 1000)
    private String usageAdvice;

    @Column(length = 1000)
    private String contraindications;

    @Column(length = 1000)
    private String commonPairings;


    @jakarta.persistence.Version
    private Integer version;

    @Column(precision = 19, scale = 6)
    private BigDecimal quantity;

    @Column(name = "remaining_quantity", precision = 19, scale = 6)
    private BigDecimal remainingQuantity;

    @Column(length = 16)
    private String unit;

    @Column(name = "gs1_lot_no", unique = true, length = 32)
    private String gs1LotNo;

    @Column(name = "gs1_code", unique = true, length = 128)
    private String gs1Code;

    @Column(name = "gs1_locked", nullable = false)
    private boolean gs1Locked;
}
