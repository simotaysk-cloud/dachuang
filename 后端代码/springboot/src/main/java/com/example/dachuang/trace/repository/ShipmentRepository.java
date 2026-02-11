package com.example.dachuang.trace.repository;

import com.example.dachuang.trace.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByShipmentNo(String shipmentNo);

    boolean existsByShipmentNo(String shipmentNo);

    @Query("SELECT s FROM Shipment s WHERE s.shipmentNo IN (SELECT si.shipmentNo FROM ShipmentItem si WHERE si.batchNo = :batchNo)")
    List<Shipment> findAllByBatchNo(@Param("batchNo") String batchNo);

    Optional<Shipment> findTopByTrackingNoOrderByCreatedAtDesc(String trackingNo);
}
