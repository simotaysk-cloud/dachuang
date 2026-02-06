package com.example.dachuang.blockchain;

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
@Table(name = "blockchain_records")
public class BlockchainRecord extends BaseEntity {
    private String batchNo;
    private String txHash; // 区块链交易哈希
    private String dataHash; // 数据摘要摘要
}
