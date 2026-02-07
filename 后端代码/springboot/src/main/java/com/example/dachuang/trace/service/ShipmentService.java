package com.example.dachuang.trace.service;

import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.dto.CreateShipmentEventRequest;
import com.example.dachuang.trace.dto.CreateShipmentRequest;
import com.example.dachuang.trace.entity.Shipment;
import com.example.dachuang.trace.entity.ShipmentEvent;
import com.example.dachuang.trace.repository.ShipmentEventRepository;
import com.example.dachuang.trace.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository shipmentEventRepository;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.BASIC_ISO_DATE; // yyyyMMdd

    public Shipment create(CreateShipmentRequest request) {
        String shipmentNo = generateShipmentNo();
        Shipment shipment = Shipment.builder()
                .shipmentNo(shipmentNo)
                .batchNo(request.getBatchNo())
                .distributorName(request.getDistributorName())
                .carrier(request.getCarrier())
                .trackingNo(request.getTrackingNo())
                .status("CREATED")
                .remarks(request.getRemarks())
                .build();
        return shipmentRepository.save(shipment);
    }

    public List<Shipment> list(String batchNo) {
        if (batchNo == null || batchNo.isBlank()) {
            return shipmentRepository.findAll();
        }
        return shipmentRepository.findAllByBatchNo(batchNo);
    }

    public ShipmentEvent addEvent(String shipmentNo, CreateShipmentEventRequest request) {
        Shipment shipment = shipmentRepository.findByShipmentNo(shipmentNo)
                .orElseThrow(() -> new BusinessException(404, "Shipment not found"));

        LocalDateTime eventTime = request.getEventTime() != null ? request.getEventTime() : LocalDateTime.now();

        ShipmentEvent event = ShipmentEvent.builder()
                .shipmentNo(shipment.getShipmentNo())
                .eventTime(eventTime)
                .location(request.getLocation())
                .status(request.getStatus())
                .details(request.getDetails())
                .build();

        // If status is provided, also update shipment status for convenience.
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            shipment.setStatus(request.getStatus());
            shipmentRepository.save(shipment);
        }

        return shipmentEventRepository.save(event);
    }

    public List<ShipmentEvent> listEvents(String shipmentNo) {
        shipmentRepository.findByShipmentNo(shipmentNo)
                .orElseThrow(() -> new BusinessException(404, "Shipment not found"));
        return shipmentEventRepository.findAllByShipmentNoOrderByEventTimeAsc(shipmentNo);
    }

    private String generateShipmentNo() {
        String date = LocalDate.now().format(DATE_FMT);
        for (int i = 0; i < 50; i++) {
            int n = RANDOM.nextInt(100000);
            String suffix = String.format("%05d", n);
            String candidate = "SHP-" + date + "-" + suffix;
            if (!shipmentRepository.existsByShipmentNo(candidate)) {
                return candidate;
            }
        }
        throw new BusinessException(500, "Failed to generate shipment number");
    }
}

