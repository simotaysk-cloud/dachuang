package com.example.dachuang.auth.config;

import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.example.dachuang.trace.repository.BatchRepository batchRepository;
    private final com.example.dachuang.trace.repository.BatchLineageRepository batchLineageRepository;
    private final com.example.dachuang.trace.repository.PlantingRecordRepository plantingRecordRepository;
    private final com.example.dachuang.trace.repository.ProcessingRecordRepository processingRecordRepository;
    private final com.example.dachuang.trace.repository.InspectionRecordRepository inspectionRecordRepository;
    private final com.example.dachuang.trace.repository.LogisticsRecordRepository logisticsRecordRepository;
    private final com.example.dachuang.trace.repository.ShipmentRepository shipmentRepository;
    private final com.example.dachuang.trace.repository.ShipmentEventRepository shipmentEventRepository;
    private final com.example.dachuang.trace.service.Gs1Service gs1Service;

    @Override
    public void run(String... args) {
        // Dev-only: keep default accounts usable even if the DB already contains old
        // rows.
        ensureDefaultUser("admin", "123456", "ADMIN", "系统管理员", "dummy_admin");
        ensureDefaultUser("farmer", "123456", "FARMER", "示范农户", "dummy_farmer");
        log.info("Default dev accounts ensured: admin/farmer (password: 123456)");

        ensureMockData();
    }

    private void ensureDefaultUser(String username, String password, String role, String nickname, String openid) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            userRepository.save(User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(password))
                    .role(role)
                    .nickname(nickname)
                    .openid(openid)
                    .build());
            return;
        }

        // Ensure fields for login and NOT NULL constraints.
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        if (user.getNickname() == null || user.getNickname().isBlank()) {
            user.setNickname(nickname);
        }
        if (user.getOpenid() == null || user.getOpenid().isBlank()) {
            user.setOpenid(openid);
        }
        userRepository.save(user);
    }

    private void ensureMockData() {
        Long farmerId = userRepository.findByUsername("farmer").map(User::getId).orElse(null);

        // 1. Planting Batch
        String plantingBatchNo = "MOCK-2024001";
        LocalDateTime baseTime = LocalDateTime.now().minusDays(30).withSecond(0).withNano(0);
        com.example.dachuang.trace.entity.Batch existingPlant = batchRepository.findByBatchNo(plantingBatchNo).orElse(null);
        if (existingPlant != null) {
            if (existingPlant.getOwnerUserId() == null && farmerId != null) {
                existingPlant.setOwnerUserId(farmerId);
                batchRepository.save(existingPlant);
            }
        } else {
            com.example.dachuang.trace.entity.Batch pBatch = com.example.dachuang.trace.entity.Batch.builder()
                    .ownerUserId(farmerId)
                    .batchNo(plantingBatchNo)
                    .minCode("MC-001")
                    .name("长白山人参 (模拟数据)")
                    .category("根茎类")
                    .origin("吉林省抚松县")
                    .status("PLANTING")
                    .quantity(new BigDecimal("500.0"))
                    .unit("jin")
                    .gs1LotNo("BATCH001")
                    .gs1Code(gs1Service.generateGs1HRI("BATCH001", new BigDecimal("500.0"), "jin"))
                    .gs1Locked(true)
                    .description("2024年春季种植示范批次")
                    .build();
            batchRepository.save(pBatch);

            plantingRecordRepository.save(com.example.dachuang.trace.entity.PlantingRecord.builder()
                    .batchNo(plantingBatchNo)
                    .operation("播种")
                    .details("选用优质人参种子，密度适中")
                    .operator("李农户")
                    .fieldName("一号示范田")
                    .latitude(43.123456)
                    .longitude(127.123456)
                    .imageUrl("https://example.com/mock/planting_seed.jpg")
                    .operationTime(baseTime.withHour(9).withMinute(10))
                    .build());

            plantingRecordRepository.save(com.example.dachuang.trace.entity.PlantingRecord.builder()
                    .batchNo(plantingBatchNo)
                    .operation("施肥")
                    .details("使用有机肥料，无农药")
                    .operator("李农户")
                    .fieldName("一号示范田")
                    .latitude(43.123489)
                    .longitude(127.123499)
                    .imageUrl("https://example.com/mock/planting_fertilize.jpg")
                    .operationTime(baseTime.plusDays(7).withHour(10).withMinute(0))
                    .build());

            plantingRecordRepository.save(com.example.dachuang.trace.entity.PlantingRecord.builder()
                    .batchNo(plantingBatchNo)
                    .operation("灌溉")
                    .details("滴灌 2 小时，记录土壤湿度。")
                    .operator("李农户")
                    .fieldName("一号示范田")
                    .latitude(43.123502)
                    .longitude(127.123512)
                    .imageUrl("https://example.com/mock/planting_irrigation.jpg")
                    .operationTime(baseTime.plusDays(10).withHour(8).withMinute(30))
                    .build());

            plantingRecordRepository.save(com.example.dachuang.trace.entity.PlantingRecord.builder()
                    .batchNo(plantingBatchNo)
                    .operation("采收")
                    .details("成熟采收，初筛分级后入库。")
                    .operator("李农户")
                    .fieldName("一号示范田")
                    .latitude(43.123520)
                    .longitude(127.123530)
                    .imageUrl("https://example.com/mock/planting_harvest.jpg")
                    .operationTime(baseTime.plusDays(25).withHour(16).withMinute(40))
                    .build());

            log.info("Mock Planting Data Created: {}", plantingBatchNo);
        }

        // 2. Processing Batch (Derived)
        String processBatchNo = "MOCK-2024001-P";
        com.example.dachuang.trace.entity.Batch existingProc = batchRepository.findByBatchNo(processBatchNo).orElse(null);
        if (existingProc != null) {
            if (existingProc.getOwnerUserId() == null && farmerId != null) {
                existingProc.setOwnerUserId(farmerId);
                batchRepository.save(existingProc);
            }
        } else {
            com.example.dachuang.trace.entity.Batch procBatch = com.example.dachuang.trace.entity.Batch.builder()
                    .ownerUserId(farmerId)
                    .batchNo(processBatchNo)
                    .minCode("MC-001-P")
                    .name("特级红参片 (模拟数据)")
                    .category("加工品")
                    .origin("吉林省抚松县加工厂")
                    .status("PROCESSING")
                    .quantity(new BigDecimal("50.0"))
                    .unit("kg") // 500斤 -> ~50kg finished product (just mock)
                    .gs1LotNo("BATCH001-P")
                    .gs1Code(gs1Service.generateGs1HRI("BATCH001-P", new BigDecimal("50.0"), "kg"))
                    .gs1Locked(true)
                    .description("经多道工序精制而成")
                    .build();
            batchRepository.save(procBatch);

            processingRecordRepository.save(com.example.dachuang.trace.entity.ProcessingRecord.builder()
                    .batchNo(processBatchNo)
                    .parentBatchNo(plantingBatchNo)
                    .processType("清洗")
                    .factory("同仁堂吉林分厂")
                    .operator("张工")
                    .details("使用山泉水清洗，去土率99%")
                    .build());

            processingRecordRepository.save(com.example.dachuang.trace.entity.ProcessingRecord.builder()
                    .batchNo(processBatchNo)
                    .parentBatchNo(plantingBatchNo)
                    .processType("切片烘干")
                    .factory("同仁堂吉林分厂")
                    .operator("王工")
                    .details("低温烘干，保留活性成分")
                    .build());

            log.info("Mock Processing Data Created: {}", processBatchNo);

            // 3. Inspection
            inspectionRecordRepository.save(com.example.dachuang.trace.entity.InspectionRecord.builder()
                    .batchNo(processBatchNo)
                    .result("合格 (Grade A)")
                    .inspector("赵质检")
                    .reportUrl("https://example.com/report/mock001.pdf")
                    .build());

            log.info("Mock Inspection Data Created");

            // 3.5 Lineage edge (root -> processing)
            if (batchLineageRepository.findByChildBatchNo(processBatchNo).isEmpty()) {
                batchLineageRepository.save(com.example.dachuang.trace.entity.BatchLineage.builder()
                        .parentBatchNo(plantingBatchNo)
                        .childBatchNo(processBatchNo)
                        .stage("PROCESSING")
                        .processType("CUT_DRY")
                        .details("采收后清洗、切片、烘干")
                        .build());
            }

            // 3.6 Logistics records (optional, to demo logistics_records module)
            if (logisticsRecordRepository.findAllByBatchNo(processBatchNo).isEmpty()) {
                logisticsRecordRepository.save(com.example.dachuang.trace.entity.LogisticsRecord.builder()
                        .batchNo(processBatchNo)
                        .fromLocation("吉林省抚松县加工厂")
                        .toLocation("北京大药房")
                        .trackingNo("SF1234567890")
                        .location("吉林发货中心")
                        .status("已揽收")
                        .updateTime(LocalDateTime.now().minusDays(3).withHour(10).withMinute(10))
                        .build());
                logisticsRecordRepository.save(com.example.dachuang.trace.entity.LogisticsRecord.builder()
                        .batchNo(processBatchNo)
                        .fromLocation("吉林省抚松县加工厂")
                        .toLocation("北京大药房")
                        .trackingNo("SF1234567890")
                        .location("北京配送中心")
                        .status("运输中")
                        .updateTime(LocalDateTime.now().minusDays(1).withHour(18).withMinute(30))
                        .build());
                logisticsRecordRepository.save(com.example.dachuang.trace.entity.LogisticsRecord.builder()
                        .batchNo(processBatchNo)
                        .fromLocation("吉林省抚松县加工厂")
                        .toLocation("北京大药房")
                        .trackingNo("SF1234567890")
                        .location("北京大药房")
                        .status("已签收")
                        .updateTime(LocalDateTime.now().minusHours(2).withMinute(0))
                        .build());
            }

            // 4. Logistics (Shipment)
            String shipmentNo = "SH-20241001";
            if (shipmentRepository.findByShipmentNo(shipmentNo).isEmpty()) {
                shipmentRepository.save(com.example.dachuang.trace.entity.Shipment.builder()
                        .shipmentNo(shipmentNo)
                        .batchNo(processBatchNo)
                        .distributorName("北京大药房")
                        .carrier("顺丰冷链")
                        .trackingNo("SF1234567890")
                        .status("DELIVERED")
                        .remarks("加急配送")
                        .build());

                shipmentEventRepository.save(com.example.dachuang.trace.entity.ShipmentEvent.builder()
                        .shipmentNo(shipmentNo)
                        .location("吉林发货中心")
                        .status("IN_TRANSIT")
                        .details("已揽收")
                        .eventTime(java.time.LocalDateTime.now().minusDays(3))
                        .build());

                shipmentEventRepository.save(com.example.dachuang.trace.entity.ShipmentEvent.builder()
                        .shipmentNo(shipmentNo)
                        .location("北京配送中心")
                        .status("IN_TRANSIT")
                        .details("到达北京")
                        .eventTime(java.time.LocalDateTime.now().minusDays(1))
                        .build());

                shipmentEventRepository.save(com.example.dachuang.trace.entity.ShipmentEvent.builder()
                        .shipmentNo(shipmentNo)
                        .location("北京大药房")
                        .status("DELIVERED")
                        .details("客户已签收，门店上架销售")
                        .eventTime(java.time.LocalDateTime.now().minusHours(2))
                        .build());

            log.info("Mock Logistics Data Created: {}", shipmentNo);
            }
        }

        // If batches already existed (legacy dev DB), make sure lineage edge is present for trace report.
        if (batchRepository.findByBatchNo(plantingBatchNo).isPresent() && batchRepository.findByBatchNo(processBatchNo).isPresent()) {
            if (batchLineageRepository.findByChildBatchNo(processBatchNo).isEmpty()) {
                batchLineageRepository.save(com.example.dachuang.trace.entity.BatchLineage.builder()
                        .parentBatchNo(plantingBatchNo)
                        .childBatchNo(processBatchNo)
                        .stage("PROCESSING")
                        .processType("CUT_DRY")
                        .details("采收后清洗、切片、烘干")
                        .build());
                log.info("Mock Lineage Edge Created: {} -> {}", plantingBatchNo, processBatchNo);
            }

            // Ensure logistics_records exist for the leaf batch (used by物流追踪模块).
            if (logisticsRecordRepository.findAllByBatchNo(processBatchNo).isEmpty()) {
                logisticsRecordRepository.save(com.example.dachuang.trace.entity.LogisticsRecord.builder()
                        .batchNo(processBatchNo)
                        .fromLocation("吉林省抚松县加工厂")
                        .toLocation("北京大药房")
                        .trackingNo("SF1234567890")
                        .location("吉林发货中心")
                        .status("已揽收")
                        .updateTime(LocalDateTime.now().minusDays(3).withHour(10).withMinute(10))
                        .build());
                logisticsRecordRepository.save(com.example.dachuang.trace.entity.LogisticsRecord.builder()
                        .batchNo(processBatchNo)
                        .fromLocation("吉林省抚松县加工厂")
                        .toLocation("北京大药房")
                        .trackingNo("SF1234567890")
                        .location("北京配送中心")
                        .status("运输中")
                        .updateTime(LocalDateTime.now().minusDays(1).withHour(18).withMinute(30))
                        .build());
                logisticsRecordRepository.save(com.example.dachuang.trace.entity.LogisticsRecord.builder()
                        .batchNo(processBatchNo)
                        .fromLocation("吉林省抚松县加工厂")
                        .toLocation("北京大药房")
                        .trackingNo("SF1234567890")
                        .location("北京大药房")
                        .status("已签收")
                        .updateTime(LocalDateTime.now().minusHours(2).withMinute(0))
                        .build());
                log.info("Mock LogisticsRecords Created for batch: {}", processBatchNo);
            }
        }
    }
}
