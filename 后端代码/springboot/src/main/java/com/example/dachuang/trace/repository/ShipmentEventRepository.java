package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.ShipmentEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShipmentEventRepository extends JpaRepository<ShipmentEvent, Long> {
    List<ShipmentEvent> findAllByShipmentNoOrderByEventTimeAsc(String shipmentNo);
}

