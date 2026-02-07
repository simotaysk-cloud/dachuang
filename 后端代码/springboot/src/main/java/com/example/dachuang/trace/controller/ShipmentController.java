package com.example.dachuang.trace.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.trace.dto.CreateShipmentEventRequest;
import com.example.dachuang.trace.dto.CreateShipmentRequest;
import com.example.dachuang.trace.entity.Shipment;
import com.example.dachuang.trace.entity.ShipmentEvent;
import com.example.dachuang.trace.service.ShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;

    @PostMapping
    public Result<Shipment> create(@Valid @RequestBody CreateShipmentRequest request) {
        return Result.success(shipmentService.create(request));
    }

    @GetMapping
    public Result<List<Shipment>> list(@RequestParam(required = false) String batchNo) {
        return Result.success(shipmentService.list(batchNo));
    }

    @PostMapping("/{shipmentNo}/events")
    public Result<ShipmentEvent> addEvent(
            @PathVariable String shipmentNo,
            @RequestBody CreateShipmentEventRequest request
    ) {
        return Result.success(shipmentService.addEvent(shipmentNo, request));
    }

    @GetMapping("/{shipmentNo}/events")
    public Result<List<ShipmentEvent>> listEvents(@PathVariable String shipmentNo) {
        return Result.success(shipmentService.listEvents(shipmentNo));
    }
}

