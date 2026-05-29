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


@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevMockDataSeeder implements CommandLineRunner {

        private static final String ROOT_BATCH_NO = "GS-DG-20231015-001";
        private static final String PROC_A_BATCH_NO = "GS-DG-QP-20231020-001";
        private static final String PROC_B_BATCH_NO = "GS-DG-HG-20231020-002";
        private static final String INSP_A_GRADE_A_BATCH_NO = "GS-DG-QP-20231025-PASS";
        private static final String INSP_B_REWORK_BATCH_NO = "GS-DG-HG-20231025-FAIL";

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
        private final BulkSeederService bulkSeederService;
        private final PasswordEncoder passwordEncoder;

        @Override
        public void run(String... args) {
                if (!enabled)
                        return;




                new Thread(() -> {
                        try {
                                Thread.sleep(2000);
                                launchSeeding();
                        } catch (Exception e) {
                                log.error("Seeder thread interrupted", e);
                        }
                }, "mock-seeder-thread").start();
        }

        @Transactional
        public void launchSeeding() {
                log.info("Starting DevMockDataSeeder background task (force={})...", force);
                try {
                        if (force) {
                                purgeDemoData();
                        }

                        if (!force && batchRepository.findByBatchNo(ROOT_BATCH_NO).isPresent() && inspectionRecordRepository.count() > 10) {
                                log.info("Mock data seems already present and complete. Skip seeding. Use force=true to re-seed.");
                                return;
                        }

                        log.info("Seeding realistic mock data for dev environment...");

                        seedUsers();
                        seedBatchesAndLineage();
                        seedPlantingRecords();
                        seedProcessingRecords();
                        seedInspectionBranching();
                        seedShipmentsAndEvents();
                        seedBlockchain();

                        log.info("Triggering diverse professional herb seeding via BulkSeeder...");
                        bulkSeederService.seedData(8);

                        log.info("==========================================================");
                        log.info("   DEV MOCK DATA SEEDING COMPLETED SUCCESSFULLY         ");
                        log.info("   Web server on port 8091 should remain ALIVE now.     ");
                        log.info("==========================================================");
                } catch (Throwable t) {
                        log.error("CRITICAL ERROR DURING MOCK SEEDING: ", t);
                }
        }

        private void seedStressTest() {
                String batchA = "STRESS-BATCH-A";
                String batchB = "STRESS-BATCH-B";

                if (batchRepository.findByBatchNo(batchA).isEmpty()) {
                        Batch b = Batch.builder().batchNo(batchA).ownerUserId(1L).name("压测数据A")
                                        .quantity(BigDecimal.valueOf(1000)).unit("kg").status("PROCESSING").build();
                        batchService.createBatch(b);
                }
                if (batchRepository.findByBatchNo(batchB).isEmpty()) {
                        Batch b = Batch.builder().batchNo(batchB).ownerUserId(1L).name("压测数据B")
                                        .quantity(BigDecimal.valueOf(1000)).unit("kg").status("PROCESSING").build();
                        batchService.createBatch(b);
                }

                for (int i = 0; i < 5; i++) {
                        String shipNo = "STRESS-SH-A-" + i;
                        if (shipmentRepository.findByShipmentNo(shipNo).isEmpty()) {
                                Shipment s = Shipment.builder().shipmentNo(shipNo).distributorName("测试分销商A")
                                                .carrier("顺丰冷链").status("已揽收").build();
                                shipmentRepository.save(s);
                                shipmentItemRepository.save(ShipmentItem.builder().shipmentNo(shipNo).batchNo(batchA)
                                                .quantity(BigDecimal.valueOf(10)).unit("kg").build());
                        }
                }

                String shipNoParams = "STRESS-SH-MIX";
                if (shipmentRepository.findByShipmentNo(shipNoParams).isEmpty()) {
                        Shipment s = Shipment.builder().shipmentNo(shipNoParams).distributorName("混合测试分销商")
                                        .carrier("中通医药").status("已发车").build();
                        shipmentRepository.save(s);
                        shipmentItemRepository.save(ShipmentItem.builder().shipmentNo(shipNoParams).batchNo(batchA)
                                        .quantity(BigDecimal.valueOf(50)).unit("kg").build());
                        shipmentItemRepository.save(ShipmentItem.builder().shipmentNo(shipNoParams).batchNo(batchB)
                                        .quantity(BigDecimal.valueOf(50)).unit("kg").build());
                }
        }

        private void seedUsers() {
                createUserIfMissing("farmer1", "123456", "FARMER", "张建国", "13800000002");
                createUserIfMissing("factory1", "123456", "FACTORY", "李伟", "13800000003");
                createUserIfMissing("regulator1", "123456", "REGULATOR", "王局长", "13800000004");
                createUserIfMissing("logistics1", "123456", "LOGISTICS", "赵师傅", "13800000005");
                createUserIfMissing("quality1", "123456", "QUALITY", "周工", "13800000006");
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
                                .minCode("")
                                .name("甘肃岷县当归")
                                .category("中药材-根茎类")
                                .origin("甘肃省定西市岷县GAP标准种植基地")
                                .status("PLANTING")
                                .quantity(new BigDecimal("1500.0"))
                                .unit("kg")
                                .description("2023年秋季采收原药材批次")
                                .build();
                batchService.createBatch(root);

                batchService.deriveBatch(ROOT_BATCH_NO, PROC_A_BATCH_NO, "PROCESSING", "半成品-饮片", "洗净、润透、切片处理", "岷县制药三厂-饮片车间",
                                "李伟", null, null);
                batchService.deriveBatch(ROOT_BATCH_NO, PROC_B_BATCH_NO, "PROCESSING", "半成品-个子", "初加工无硫恒温干燥", "岷县制药三厂-干燥中心", "李伟", null, null);

                batchService.deriveBatch(PROC_A_BATCH_NO, INSP_A_GRADE_A_BATCH_NO, "INSPECTION", "成品-合格", "理化全检合格",
                                "集团质控中心", "周工", null, null);
                batchService.deriveBatch(PROC_B_BATCH_NO, INSP_B_REWORK_BATCH_NO, "INSPECTION", "成品-不合格", "水分超标驳回",
                                "集团质控中心", "周工", null, null);

                List<BatchLineage> edges = batchLineageRepository.findAllByParentBatchNo(ROOT_BATCH_NO);
                if (edges.isEmpty()) {
                        log.warn("No lineage edges found for root batch.");
                }
        }

        private void seedPlantingRecords() {
                LocalDateTime baseTime = LocalDateTime.now().minusDays(10);

                plantingRecordRepository.save(PlantingRecord.builder()
                                .batchNo(ROOT_BATCH_NO)
                                .fieldName("岷县A区-1号高山药田")
                                .operation("幼苗移栽")
                                .details("选用优质岷归1号脱毒苗，株距30cm进行移栽。")
                                .operator("张建国")
                                .latitude(34.423456)
                                .longitude(104.023456)
                                .operationTime(baseTime)
                                .imageUrl("https://example.com/mock/seed.jpg")
                                .build());

                plantingRecordRepository.save(PlantingRecord.builder()
                                .batchNo(ROOT_BATCH_NO)
                                .fieldName("岷县A区-1号高山药田")
                                .operation("生态追肥")
                                .details("施用农家发酵有机肥 500kg，未施用任何化肥。")
                                .operator("张建国")
                                .latitude(34.423489)
                                .longitude(104.023499)
                                .operationTime(baseTime.plusDays(2))
                                .imageUrl("https://example.com/mock/fertilize.jpg")
                                .build());

                plantingRecordRepository.save(PlantingRecord.builder()
                                .batchNo(ROOT_BATCH_NO)
                                .fieldName("岷县A区-1号高山药田")
                                .operation("水利灌溉")
                                .details("引流高山雪水滴灌，保持土壤含水量适中。")
                                .operator("张建国")
                                .latitude(34.423501)
                                .longitude(104.023512)
                                .operationTime(baseTime.plusDays(4))
                                .imageUrl("https://example.com/mock/irrigation.jpg")
                                .build());
        }

        private void seedProcessingRecords() {
                LocalDateTime baseTime = LocalDateTime.now().minusDays(5);

                processingRecordRepository.save(ProcessingRecord.builder()
                                .batchNo(PROC_A_BATCH_NO)
                                .parentBatchNo(ROOT_BATCH_NO)
                                .processType("润透切片")
                                .factory("岷县制药三厂-饮片GMP车间")
                                .details("清洗泥沙，润透至无硬心，切薄片，厚度2-3mm。")
                                .operator("李伟")
                                .imageUrl("")
                                .build());
                jdbcTemplate.update("update processing_records set created_at = ? where batch_no = ?",
                                baseTime, PROC_A_BATCH_NO);

                processingRecordRepository.save(ProcessingRecord.builder()
                                .batchNo(PROC_B_BATCH_NO)
                                .parentBatchNo(ROOT_BATCH_NO)
                                .processType("无硫烘干")
                                .factory("岷县制药三厂-微波干燥中心")
                                .details("60度低温微波无硫干燥技术处理48小时。")
                                .operator("李伟")
                                .imageUrl("")
                                .build());
                jdbcTemplate.update("update processing_records set created_at = ? where batch_no = ?",
                                baseTime, PROC_B_BATCH_NO);
        }

        private void seedInspectionBranching() {
                LocalDateTime baseTime = LocalDateTime.now().minusDays(3);


                inspectionRecordRepository.save(InspectionRecord.builder()
                                .batchNo(ROOT_BATCH_NO)
                                .inspectionType("RAW")
                                .result("【原料初检-合格】性状：根略呈圆柱形, 断面皮部厚, 有棕色油点；水分：11.5%；二氧化硫残留：未检出；重金属(Pb/Cd/As)：低于国家限量标准。")
                                .reportUrl("https://cpuzhbc.cn/reports/raw-001.pdf")
                                .inspector("周工")
                                .build());
                jdbcTemplate.update("update inspection_records set created_at = ? where batch_no = ? and inspection_type = 'RAW'",
                                baseTime.minusDays(1), ROOT_BATCH_NO);

                inspectionRecordRepository.save(InspectionRecord.builder()
                                .batchNo(INSP_A_GRADE_A_BATCH_NO)
                                .inspectionType("FINISHED")
                                .result("【成品精检-合格】级别：特级品；性状：类圆形薄片, 气浓香, 味甘、辛、微苦；水分：8.2%；阿魏酸含量：0.085%（标准≥0.050%）；浸出物：52.4%。")
                                .reportUrl("https://cpuzhbc.cn/reports/finished-pass-001.pdf")
                                .inspector("周工")
                                .build());
                jdbcTemplate.update("update inspection_records set created_at = ? where batch_no = ?",
                                baseTime, INSP_A_GRADE_A_BATCH_NO);

                inspectionRecordRepository.save(InspectionRecord.builder()
                                .batchNo(INSP_B_REWORK_BATCH_NO)
                                .inspectionType("FINISHED")
                                .result("【成品精检-不合格】检验结论：水分超标且有效成分不足；指标：水分16.8% (限度15.0%)；阿魏酸0.042% (限度0.050%)；处理建议：驳回至干燥中心返工。")
                                .reportUrl("https://cpuzhbc.cn/reports/finished-fail-002.pdf")
                                .inspector("周工")
                                .build());
                jdbcTemplate.update("update inspection_records set created_at = ? where batch_no = ?",
                                baseTime, INSP_B_REWORK_BATCH_NO);
        }

        private void seedShipmentsAndEvents() {
                Shipment s1 = shipmentService.create(createShipmentRequest(
                                INSP_A_GRADE_A_BATCH_NO,
                                "国药控股（四川）医疗器械有限公司",
                                "顺丰医药冷链",
                                "SF160938271612",
                                "【急件】发往省中心医院中药房"));

                Shipment s2 = shipmentService.create(createShipmentRequest(
                                INSP_A_GRADE_A_BATCH_NO,
                                "上海雷允上药业有限公司",
                                "中通冷链",
                                "ZT389012489012",
                                "常规饮片发运备货"));

                List<CreateShipmentEventRequest> s1Events = new ArrayList<>();
                s1Events.add(createEvent(LocalDateTime.now().minusHours(12), "甘肃定西总仓", "已发车", "货物已揽收，正发往兰州枢纽"));
                s1Events.add(createEvent(LocalDateTime.now().minusHours(6), "顺丰兰州集散中心", "干线运输中", "到达转运中心，进行消杀作业"));
                s1Events.add(createEvent(LocalDateTime.now().minusMinutes(30), "成都高新区分拨中心", "派送中", "冷藏车市区派送中，温度监控2-8度"));
                s1Events.add(createEvent(LocalDateTime.now().minusMinutes(5), "四川大学华西医院", "已签收", "签收人：药房代表"));
                addEventsIfNone(s1.getShipmentNo(), s1Events);

                List<CreateShipmentEventRequest> s2Events = new ArrayList<>();
                s2Events.add(createEvent(LocalDateTime.now().minusHours(24), "甘肃定西总仓", "已发车", "货物已打包并装车"));
                s2Events.add(createEvent(LocalDateTime.now().minusHours(2), "上海虹桥航空枢纽", "干线运输中", "航班落地虹桥机场并完成卸货"));
                addEventsIfNone(s2.getShipmentNo(), s2Events);

                Shipment s3 = shipmentService.create(createShipmentRequest(
                                INSP_B_REWORK_BATCH_NO,
                                "岷县制药三厂-干燥中心（内调）",
                                "厂区内部物流车队",
                                "TRUCK-NB088",
                                "质控拦截，内部转运返工处理"));
                List<CreateShipmentEventRequest> s3Events = new ArrayList<>();
                s3Events.add(createEvent(LocalDateTime.now().minusHours(6), "质控中心发货区", "转运中", "内部调拨发车"));
                s3Events.add(createEvent(LocalDateTime.now().minusHours(2), "岷县制药三厂-干燥中心", "已签收", "到达返工车间，等待接收入库"));
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
                blockchainService.recordOnChain(ROOT_BATCH_NO, "seed:root");
                blockchainService.recordOnChain(INSP_A_GRADE_A_BATCH_NO, "seed:leaf");
        }

        private void purgeDemoData() {
                log.warn("Purging all GS-* and STRESS-* mock data (app.mock-data.force=true)...");

                jdbcTemplate.update("DELETE se FROM shipment_events se INNER JOIN shipment_items si ON se.shipment_no = si.shipment_no WHERE si.batch_no LIKE 'GS-%' OR si.batch_no LIKE 'STRESS-%'");
                jdbcTemplate.update("DELETE s FROM shipments s INNER JOIN shipment_items si ON s.shipment_no = si.shipment_no WHERE si.batch_no LIKE 'GS-%' OR si.batch_no LIKE 'STRESS-%'");
                jdbcTemplate.update("DELETE FROM shipment_items WHERE batch_no LIKE 'GS-%' OR batch_no LIKE 'STRESS-%'");

                jdbcTemplate.update(
                                "delete from logistics_records where batch_no like 'GS-%' or batch_no like 'STRESS-%'");
                jdbcTemplate.update(
                                "delete from inspection_records where batch_no like 'GS-%' or batch_no like 'STRESS-%'");
                jdbcTemplate.update(
                                "delete from processing_records where batch_no like 'GS-%' or batch_no like 'STRESS-%'");
                jdbcTemplate.update(
                                "delete from planting_records where batch_no like 'GS-%' or batch_no like 'STRESS-%'");

                jdbcTemplate.update(
                                "delete from batch_lineages where parent_batch_no like 'GS-%' or child_batch_no like 'GS-%' or parent_batch_no like 'STRESS-%' or child_batch_no like 'STRESS-%'");
                try {
                        jdbcTemplate.update("delete from blockchain_records where batch_no like 'GS-%' or batch_no like 'STRESS-%'");
                        jdbcTemplate.update("delete from batches where batch_no like 'GS-%' or batch_no like 'STRESS-%'");
                } catch (Exception e) {
                        log.warn("Secondary cleanup failed (might be expected): " + e.getMessage());
                }
        }
}
