package com.example.dachuang.blockchain;

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
@Table(name = "blockchain_records")
public class BlockchainRecord extends BaseEntity {
    @Column(nullable = false, unique = true, length = 64)
    private String batchNo;
    @Column(unique = true, length = 80)
    private String txHash; // 区块链交易哈希
    @Column(length = 80)
    private String dataHash; // 数据摘要摘要
}
