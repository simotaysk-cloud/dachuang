package com.example.dachuang.trace.dto;

import com.example.dachuang.trace.entity.Shipment;
import com.example.dachuang.trace.entity.ShipmentEvent;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ShipmentWithEvents {
    private Shipment shipment;
    private List<ShipmentEvent> events;
}

