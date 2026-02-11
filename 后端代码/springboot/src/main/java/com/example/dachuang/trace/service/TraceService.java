package com.example.dachuang.trace.service;

import com.example.dachuang.trace.dto.TraceResponse;
import com.example.dachuang.trace.dto.ShipmentWithEvents;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.entity.BatchLineage;
import com.example.dachuang.trace.entity.LogisticsRecord;
import com.example.dachuang.trace.entity.Shipment;
import com.example.dachuang.trace.entity.ShipmentEvent;
import com.example.dachuang.blockchain.BlockchainService;
import com.example.dachuang.trace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TraceService {

    private final BatchService batchService;
    private final PlantingRecordRepository plantingRecordRepository;
    private final ProcessingRecordRepository processingRecordRepository;
    private final InspectionRecordRepository inspectionRecordRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository shipmentEventRepository;
    private final BlockchainService blockchainService;

    public TraceResponse getFullTraceByBatchNo(String batchNo) {
        List<Batch> lineageBatches = new ArrayList<>();
        List<BatchLineage> lineageEdges = new ArrayList<>();

        String cursor = batchNo;
        while (true) {
            Batch current = batchService.getBatchByNo(cursor);
            lineageBatches.add(current);

            BatchLineage parentEdge = batchService.getParentEdge(cursor);
            if (parentEdge == null)
                break;
            lineageEdges.add(parentEdge);
            cursor = parentEdge.getParentBatchNo();
        }

        Collections.reverse(lineageBatches);
        Collections.reverse(lineageEdges);

        Batch batch = lineageBatches.get(lineageBatches.size() - 1);
        String rootBatchNo = lineageBatches.get(0).getBatchNo();
        List<String> batchNosInChain = lineageBatches.stream().map(Batch::getBatchNo).toList();

        List<ShipmentWithEvents> shipmentsWithEvents = shipmentRepository.findAllByBatchNo(batch.getBatchNo()).stream()
                .map(shipment -> ShipmentWithEvents.builder()
                        .shipment(shipment)
                        .events(shipmentEventRepository
                                .findAllByShipmentNoOrderByEventTimeAsc(shipment.getShipmentNo()))
                        .build())
                .toList();

        List<LogisticsRecord> logisticsRecords = buildLogisticsFromShipments(batch.getBatchNo(), shipmentsWithEvents);

        return TraceResponse.builder()
                .batch(batch)
                .lineageBatches(lineageBatches)
                .lineageEdges(lineageEdges)
                .plantingRecords(plantingRecordRepository.findAllByBatchNo(rootBatchNo))
                .processingRecords(processingRecordRepository.findAllByBatchNoIn(batchNosInChain))
                .logisticsRecords(logisticsRecords)
                .inspectionRecords(inspectionRecordRepository.findAllByBatchNoIn(batchNosInChain))
                .shipmentsWithEvents(shipmentsWithEvents)
                .blockchainRecord(blockchainService.getRecord(batchNo))
                .build();
    }

    private List<LogisticsRecord> buildLogisticsFromShipments(String batchNo, List<ShipmentWithEvents> shipmentsWithEvents) {
        List<LogisticsRecord> rows = new ArrayList<>();
        if (shipmentsWithEvents == null || shipmentsWithEvents.isEmpty()) {
            return rows;
        }

        for (ShipmentWithEvents swe : shipmentsWithEvents) {
            Shipment shipment = swe == null ? null : swe.getShipment();
            List<ShipmentEvent> events = swe == null ? null : swe.getEvents();
            if (shipment == null) {
                continue;
            }

            if (events == null || events.isEmpty()) {
                LogisticsRecord row = new LogisticsRecord();
                row.setBatchNo(batchNo);
                row.setTrackingNo(shipment.getTrackingNo());
                row.setFromLocation("待发运");
                row.setToLocation(shipment.getDistributorName());
                row.setLocation(shipment.getDistributorName());
                row.setStatus((shipment.getStatus() == null || shipment.getStatus().isBlank()) ? "CREATED" : shipment.getStatus());
                row.setUpdateTime(shipment.getCreatedAt());
                rows.add(row);
                continue;
            }

            for (ShipmentEvent event : events) {
                if (event == null) {
                    continue;
                }
                LogisticsRecord row = new LogisticsRecord();
                row.setBatchNo(batchNo);
                row.setTrackingNo(shipment.getTrackingNo());
                row.setFromLocation("待发运");
                row.setToLocation(shipment.getDistributorName());
                row.setLocation(event.getLocation());
                row.setStatus(event.getStatus());
                row.setUpdateTime(event.getEventTime());
                rows.add(row);
            }
        }

        rows.sort(Comparator.comparing(LogisticsRecord::getUpdateTime, Comparator.nullsLast(Comparator.naturalOrder())));
        return rows;
    }
}
