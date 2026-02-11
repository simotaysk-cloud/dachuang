package com.example.dachuang.dev;

import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.repository.UserRepository;
import com.example.dachuang.blockchain.BlockchainService;
import com.example.dachuang.trace.dto.CreateShipmentEventRequest;
import com.example.dachuang.trace.dto.CreateShipmentRequest;
import com.example.dachuang.trace.entity.*;
import com.example.dachuang.trace.repository.*;
import com.example.dachuang.trace.service.BatchService;
import com.example.dachuang.trace.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Dev-only mock data seeder.
 *
 * Enable via env var: APP_MOCK_DATA_ENABLED=true
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevMockDataSeeder implements CommandLineRunner {

        private static final String ROOT_BATCH_NO = "DEMO-PLANT-001";
        private static final String PROC_A_BATCH_NO = "DEMO-PROC-A";
        private static final String PROC_B_BATCH_NO = "DEMO-PROC-B";
        private static final String INSP_A_GRADE_A_BATCH_NO = "DEMO-INSP-A-GRADE-A";
        private static final String INSP_B_REWORK_BATCH_NO = "DEMO-INSP-B-REWORK";

        @Value("${app.mock-data.enabled:false}")
        private boolean enabled;

        @Value("${app.mock-data.force:false}")
        private boolean force;

        private final UserRepository userRepository;
        private final BatchRepository batchRepository;
        private final BatchLineageRepository batchLineageRepository;
        private final PlantingRecordRepository plantingRecordRepository;
        private final ProcessingRecordRepository processingRecordRepository;
        private final InspectionRecordRepository inspectionRecordRepository;
        private final ShipmentRepository shipmentRepository;
        private final ShipmentItemRepository shipmentItemRepository;
        private final ShipmentEventRepository shipmentEventRepository;

        private final BatchService batchService;
        private final ShipmentService shipmentService;
        private final BlockchainService blockchainService;
        private final JdbcTemplate jdbcTemplate;
        private final PasswordEncoder passwordEncoder;

        @Override
        @Transactional
        public void run(String... args) {
                if (!enabled) {
                        return;
                }

                if (force) {
                        purgeDemoData();
                }

                // If demo root already exists, assume the dataset has been seeded.
                if (batchRepository.findByBatchNo(ROOT_BATCH_NO).isPresent()) {
                        log.info("Mock data already present ({}). Skip seeding.", ROOT_BATCH_NO);
                        return;
                }

                log.info("Seeding mock data for dev environment...");

                seedUsers();
                seedBatchesAndLineage();
                seedPlantingRecords();
                seedProcessingRecords();
                seedInspectionBranching();
                seedShipmentsAndEvents();
                seedBlockchain();
                seedStressTest();

                log.info("Mock data seed completed.");
        }

        private void seedStressTest() {
                log.info("Seeding stress test data...");
                String batchA = "STRESS-BATCH-A";
                String batchB = "STRESS-BATCH-B";

                // Create batches if not exist
                if (batchRepository.findByBatchNo(batchA).isEmpty()) {
                        Batch b = Batch.builder().batchNo(batchA).ownerUserId(1L).name("Stress A")
                                        .quantity(BigDecimal.valueOf(1000)).unit("kg").status("PROCESSING").build();
                        batchService.createBatch(b);
                }
                if (batchRepository.findByBatchNo(batchB).isEmpty()) {
                        Batch b = Batch.builder().batchNo(batchB).ownerUserId(1L).name("Stress B")
                                        .quantity(BigDecimal.valueOf(1000)).unit("kg").status("PROCESSING").build();
                        batchService.createBatch(b);
                }

                // 1. One Batch -> Multiple Shipments
                for (int i = 0; i < 5; i++) {
                        String shipNo = "STRESS-SH-A-" + i;
                        if (shipmentRepository.findByShipmentNo(shipNo).isEmpty()) {
                                Shipment s = Shipment.builder().shipmentNo(shipNo).distributorName("Dist A")
                                                .carrier("SF").status("CREATED").build();
                                shipmentRepository.save(s);
                                shipmentItemRepository.save(ShipmentItem.builder().shipmentNo(shipNo).batchNo(batchA)
                                                .quantity(BigDecimal.valueOf(10)).unit("kg").build());
                                log.info("Created stress shipment: {}", shipNo);
                        }
                }

                // 2. Multiple Batches -> One Shipment
                String shipNoParams = "STRESS-SH-MIX";
                if (shipmentRepository.findByShipmentNo(shipNoParams).isEmpty()) {
                        Shipment s = Shipment.builder().shipmentNo(shipNoParams).distributorName("Dist Mix")
                                        .carrier("SF").status("CREATED").build();
                        shipmentRepository.save(s);
                        shipmentItemRepository.save(ShipmentItem.builder().shipmentNo(shipNoParams).batchNo(batchA)
                                        .quantity(BigDecimal.valueOf(50)).unit("kg").build());
                        shipmentItemRepository.save(ShipmentItem.builder().shipmentNo(shipNoParams).batchNo(batchB)
                                        .quantity(BigDecimal.valueOf(50)).unit("kg").build());
                        log.info("Created stress mixed shipment: {}", shipNoParams);
                }
        }

        private void seedUsers() {
                // Note: default `admin` / `farmer` are handled by auth/config/DataInitializer.
                createUserIfMissing("farmer1", "123456", "FARMER", "张三", "13800000002");
                createUserIfMissing("factory1", "123456", "FACTORY", "李四", "13800000003");
                createUserIfMissing("regulator1", "123456", "REGULATOR", "王五", "13800000004");
                createUserIfMissing("logistics1", "123456", "LOGISTICS", "赵六", "13800000005");
                createUserIfMissing("quality1", "123456", "QUALITY", "周七", "13800000006");
        }

        private void createUserIfMissing(String username, String password, String role, String name, String phone) {
                if (userRepository.findByUsername(username).isPresent()) {
                        return;
                }
                User u = User.builder()
                                .username(username)
                                .password(passwordEncoder.encode(password))
                                .role(role)
                                .nickname(username)
                                .name(name)
                                .phone(phone)
                                // Some existing dev schemas have `openid` as NOT NULL; keep it always
                                // populated.
                                .openid("mock_openid_" + username)
                                .build();
                userRepository.save(u);
        }

        private void seedBatchesAndLineage() {
                Long ownerId = userRepository.findByUsername("farmer1")
                                .or(() -> userRepository.findByUsername("farmer"))
                                .map(User::getId)
                                .orElse(null);

                Batch root = Batch.builder()
                                .ownerUserId(ownerId)
                                .batchNo(ROOT_BATCH_NO)
                                .minCode("") // auto-generate
                                .name("当归")
                                .category("中药材")
                                .origin("甘肃-岷县")
                                .status("PLANTING")
                                .quantity(new BigDecimal("1000.0"))
                                .unit("kg")
                                .description("演示数据：根批次（种植原料）")
                                .build();
                batchService.createBatch(root);

                // Create deterministic processing branches using deriveBatch (so lineage
                batchService.deriveBatch(ROOT_BATCH_NO, PROC_A_BATCH_NO, "PROCESSING", "SLICE", "切片工艺分支", "切片一车间",
                                "李四");
                batchService.deriveBatch(ROOT_BATCH_NO, PROC_B_BATCH_NO, "PROCESSING", "DRY", "晒干工艺分支", "晒场二区", "王五");

                // Pre-create inspection branches (derive stage INSPECTION). Records added in
                // seedInspectionBranching.
                batchService.deriveBatch(PROC_A_BATCH_NO, INSP_A_GRADE_A_BATCH_NO, "INSPECTION", "GRADE_A", "分级为 A",
                                "质检站1", "赵六");
                batchService.deriveBatch(PROC_B_BATCH_NO, INSP_B_REWORK_BATCH_NO, "INSPECTION", "REWORK", "返工处理",
                                "返修车间", "钱七");

                // Sanity: make sure lineage rows exist (deriveBatch should create them; this is
                // just a guard).
                List<BatchLineage> edges = batchLineageRepository.findAllByParentBatchNo(ROOT_BATCH_NO);
                if (edges.isEmpty()) {
                        log.warn("No lineage edges found for root batch. Check BatchService.deriveBatch().");
                }
        }

        private void seedPlantingRecords() {
                LocalDateTime baseTime = LocalDateTime.now().minusDays(10);

                plantingRecordRepository.save(PlantingRecord.builder()
                                .batchNo(ROOT_BATCH_NO)
                                .fieldName("一号地块")
                                .operation("播种")
                                .details("春季播种，土壤湿度正常。")
                                .operator("张三")
                                .latitude(34.123456)
                                .longitude(104.123456)
                                .operationTime(baseTime)
                                .imageUrl("https://example.com/mock/seed.jpg")
                                .build());

                plantingRecordRepository.save(PlantingRecord.builder()
                                .batchNo(ROOT_BATCH_NO)
                                .fieldName("一号地块")
                                .operation("施肥")
                                .details("使用有机肥 50kg。")
                                .operator("张三")
                                .latitude(34.123489)
                                .longitude(104.123499)
                                .operationTime(baseTime.plusDays(2))
                                .imageUrl("https://example.com/mock/fertilize.jpg")
                                .build());

                plantingRecordRepository.save(PlantingRecord.builder()
                                .batchNo(ROOT_BATCH_NO)
                                .fieldName("一号地块")
                                .operation("灌溉")
                                .details("滴灌 2 小时，天气晴。")
                                .operator("张三")
                                .latitude(34.123501)
                                .longitude(104.123512)
                                .operationTime(baseTime.plusDays(4))
                                .imageUrl("https://example.com/mock/irrigation.jpg")
                                .build());
        }

        private void seedProcessingRecords() {
                LocalDateTime baseTime = LocalDateTime.now().minusDays(5);

                // Record for branch A
                processingRecordRepository.save(ProcessingRecord.builder()
                                .batchNo(PROC_A_BATCH_NO)
                                .parentBatchNo(ROOT_BATCH_NO)
                                .processType("SLICE")
                                .factory("演示工厂-1号车间")
                                .details("切片厚度 3mm")
                                .operator("李四")
                                .imageUrl("")
                                .build());
                jdbcTemplate.update("update processing_records set created_at = ? where batch_no = ?",
                                baseTime, PROC_A_BATCH_NO);

                // Record for branch B
                processingRecordRepository.save(ProcessingRecord.builder()
                                .batchNo(PROC_B_BATCH_NO)
                                .parentBatchNo(ROOT_BATCH_NO)
                                .processType("DRY")
                                .factory("演示工厂-2号车间")
                                .details("日晒 48 小时")
                                .operator("李四")
                                .imageUrl("")
                                .build());
                jdbcTemplate.update("update processing_records set created_at = ? where batch_no = ?",
                                baseTime, PROC_B_BATCH_NO);
        }

        private void seedInspectionBranching() {
                LocalDateTime baseTime = LocalDateTime.now().minusDays(3);

                inspectionRecordRepository.save(InspectionRecord.builder()
                                .batchNo(INSP_A_GRADE_A_BATCH_NO)
                                .result("GRADE_A")
                                .reportUrl("https://example.com/reports/demo-grade-a.pdf")
                                .inspector("王五")
                                .build());
                jdbcTemplate.update("update inspection_records set created_at = ? where batch_no = ?",
                                baseTime, INSP_A_GRADE_A_BATCH_NO);

                inspectionRecordRepository.save(InspectionRecord.builder()
                                .batchNo(INSP_B_REWORK_BATCH_NO)
                                .result("REWORK")
                                .reportUrl("https://example.com/reports/demo-rework.pdf")
                                .inspector("王五")
                                .build());
                jdbcTemplate.update("update inspection_records set created_at = ? where batch_no = ?",
                                baseTime, INSP_B_REWORK_BATCH_NO);
        }

        private void seedShipmentsAndEvents() {
                // Two shipments for the same leaf batch, to demo split logistics.
                Shipment s1 = shipmentService.create(createShipmentRequest(
                                INSP_A_GRADE_A_BATCH_NO,
                                "经销商A（成都）",
                                "顺丰",
                                "SF1234567890",
                                "演示：第一票发运"));

                Shipment s2 = shipmentService.create(createShipmentRequest(
                                INSP_A_GRADE_A_BATCH_NO,
                                "经销商B（上海）",
                                "中通",
                                "ZT0987654321",
                                "演示：第二票发运"));

                List<CreateShipmentEventRequest> s1Events = new ArrayList<>();
                s1Events.add(createEvent(LocalDateTime.now().minusHours(12), "甘肃-岷县仓", "IN_TRANSIT", "已揽收"));
                s1Events.add(createEvent(LocalDateTime.now().minusHours(6), "兰州中转仓", "IN_TRANSIT", "到达中转仓"));
                s1Events.add(createEvent(LocalDateTime.now().minusMinutes(30), "成都分拨中心", "DELIVERED", "签收完成"));
                addEventsIfNone(s1.getShipmentNo(), s1Events);

                List<CreateShipmentEventRequest> s2Events = new ArrayList<>();
                s2Events.add(createEvent(LocalDateTime.now().minusHours(24), "甘肃-岷县仓", "IN_TRANSIT", "已揽收"));
                s2Events.add(createEvent(LocalDateTime.now().minusHours(2), "上海虹桥转运中心", "DELIVERED", "签收完成"));
                addEventsIfNone(s2.getShipmentNo(), s2Events);

                // One shipment for the REWORK branch, to show that different leaf batches can
                // have different downstream flow.
                Shipment s3 = shipmentService.create(createShipmentRequest(
                                INSP_B_REWORK_BATCH_NO,
                                "返工处理点（工厂复检）",
                                "自有车队",
                                "TRUCK-0001",
                                "演示：返工批次流转"));
                List<CreateShipmentEventRequest> s3Events = new ArrayList<>();
                s3Events.add(createEvent(LocalDateTime.now().minusHours(6), "兰州中转仓", "IN_TRANSIT", "转运发车"));
                s3Events.add(createEvent(LocalDateTime.now().minusHours(2), "演示工厂-复检区", "DELIVERED", "到达复检区"));
                addEventsIfNone(s3.getShipmentNo(), s3Events);
        }

        private CreateShipmentRequest createShipmentRequest(String batchNo, String distributorName, String carrier,
                        String trackingNo, String remarks) {
                CreateShipmentRequest r = new CreateShipmentRequest();
                CreateShipmentRequest.Item item = new CreateShipmentRequest.Item();
                item.setBatchNo(batchNo);
                r.setItems(List.of(item));
                r.setDistributorName(distributorName);
                r.setCarrier(carrier);
                r.setTrackingNo(trackingNo);
                r.setRemarks(remarks);
                return r;
        }

        private CreateShipmentEventRequest createEvent(LocalDateTime time, String location, String status,
                        String details) {
                CreateShipmentEventRequest r = new CreateShipmentEventRequest();
                r.setEventTime(time);
                r.setLocation(location);
                r.setStatus(status);
                r.setDetails(details);
                return r;
        }

        private void addEventsIfNone(String shipmentNo, List<CreateShipmentEventRequest> events) {
                if (!shipmentEventRepository.findAllByShipmentNoOrderByEventTimeAsc(shipmentNo).isEmpty()) {
                        return;
                }
                for (CreateShipmentEventRequest e : events) {
                        shipmentService.addEvent(shipmentNo, e);
                }
        }

        private void seedBlockchain() {
                // Only create one record per batchNo for demo readability.
                blockchainService.recordOnChain(ROOT_BATCH_NO, "seed:root");
                blockchainService.recordOnChain(INSP_A_GRADE_A_BATCH_NO, "seed:leaf");
        }

        private void purgeDemoData() {
                log.warn("Purging DEMO-* and STRESS-* mock data (app.mock-data.force=true)...");

                // child tables first
                jdbcTemplate.update("""
                                delete from shipment_events
                                where shipment_no in (
                                    select s.shipment_no from shipments s
                                    join shipment_items si on s.shipment_no = si.shipment_no
                                    where si.batch_no like 'DEMO-%' or si.batch_no like 'STRESS-%'
                                )
                                """);
                jdbcTemplate.update(
                                "delete from shipment_items where batch_no like 'DEMO-%' or batch_no like 'STRESS-%'");
                jdbcTemplate.update(
                                "delete from shipments where shipment_no not in (select shipment_no from shipment_items)");

                jdbcTemplate.update(
                                "delete from logistics_records where batch_no like 'DEMO-%' or batch_no like 'STRESS-%'");
                jdbcTemplate.update(
                                "delete from inspection_records where batch_no like 'DEMO-%' or batch_no like 'STRESS-%'");
                jdbcTemplate.update(
                                "delete from processing_records where batch_no like 'DEMO-%' or batch_no like 'STRESS-%'");
                jdbcTemplate.update(
                                "delete from planting_records where batch_no like 'DEMO-%' or batch_no like 'STRESS-%'");

                jdbcTemplate.update(
                                "delete from batch_lineages where parent_batch_no like 'DEMO-%' or child_batch_no like 'DEMO-%' or parent_batch_no like 'STRESS-%' or child_batch_no like 'STRESS-%'");
                jdbcTemplate.update(
                                "delete from blockchain_records where batch_no like 'DEMO-%' or batch_no like 'STRESS-%'");
                jdbcTemplate.update("delete from batches where batch_no like 'DEMO-%' or batch_no like 'STRESS-%'");

                // Users seeded here (keep admin/farmer managed by DataInitializer).
                jdbcTemplate.update(
                                "delete from users where username in ('farmer1','factory1','regulator1','logistics1')");
        }
}
