package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.ShipmentItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShipmentItemRepository extends JpaRepository<ShipmentItem, Long> {
    List<ShipmentItem> findByBatchNo(String batchNo);

    List<ShipmentItem> findByShipmentNo(String shipmentNo);
}
