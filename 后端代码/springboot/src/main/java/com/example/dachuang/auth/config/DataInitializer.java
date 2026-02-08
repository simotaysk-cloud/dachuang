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
        private final com.example.dachuang.trace.repository.PlantingRecordRepository plantingRecordRepository;
        private final com.example.dachuang.trace.repository.ProcessingRecordRepository processingRecordRepository;
        private final com.example.dachuang.trace.repository.InspectionRecordRepository inspectionRecordRepository;
        private final com.example.dachuang.trace.repository.ShipmentRepository shipmentRepository;
        private final com.example.dachuang.trace.repository.ShipmentEventRepository shipmentEventRepository;
        private final com.example.dachuang.trace.repository.BatchLineageRepository batchLineageRepository;
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

                // 1. Planting Batch: Changbai Mountain Ginseng
                String plantingBatchNo = "MOCK-2024001";
                if (batchRepository.findByBatchNo(plantingBatchNo).isEmpty()) {
                        com.example.dachuang.trace.entity.Batch pBatch = com.example.dachuang.trace.entity.Batch
                                        .builder()
                                        .ownerUserId(farmerId)
                                        .batchNo(plantingBatchNo)
                                        .minCode("MC-001")
                                        .name("长白山人参 (模拟数据)")
                                        .category("根茎类")
                                        .origin("吉林省抚松县")
                                        .status("PLANTING")
                                        .quantity(500.0)
                                        .unit("jin")
                                        .gs1LotNo("BATCH001")
                                        .gs1Code(gs1Service.generateGs1HRI("BATCH001", 500.0, "jin"))
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
                                        .build());

                        plantingRecordRepository.save(com.example.dachuang.trace.entity.PlantingRecord.builder()
                                        .batchNo(plantingBatchNo)
                                        .operation("施肥")
                                        .details("使用有机肥料，无农药")
                                        .operator("李农户")
                                        .fieldName("一号示范田")
                                        .build());

                        log.info("Mock Planting Data Created: {}", plantingBatchNo);
                }

                // 2. Processing Batch (Derived)
                String processBatchNo = "MOCK-2024001-P";
                if (batchRepository.findByBatchNo(processBatchNo).isEmpty()) {
                        com.example.dachuang.trace.entity.Batch procBatch = com.example.dachuang.trace.entity.Batch
                                        .builder()
                                        .ownerUserId(farmerId)
                                        .batchNo(processBatchNo)
                                        .minCode("MC-001-P")
                                        .name("特级红参片 (模拟数据)")
                                        .category("加工品")
                                        .origin("吉林省抚松县加工厂")
                                        .status("PROCESSING")
                                        .quantity(50.0)
                                        .unit("kg")
                                        .gs1LotNo("BATCH001-P")
                                        .gs1Code(gs1Service.generateGs1HRI("BATCH001-P", 50.0, "kg"))
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

                        batchLineageRepository.save(com.example.dachuang.trace.entity.BatchLineage.builder()
                                        .parentBatchNo(plantingBatchNo)
                                        .childBatchNo(processBatchNo)
                                        .stage("PROCESSING")
                                        .processType("切片烘干")
                                        .build());

                        inspectionRecordRepository.save(com.example.dachuang.trace.entity.InspectionRecord.builder()
                                        .batchNo(processBatchNo)
                                        .result("合格 (Grade A)")
                                        .inspector("赵质检")
                                        .reportUrl("https://example.com/report/mock001.pdf")
                                        .build());

                        log.info("Mock Processing and Inspection Data Created: {}", processBatchNo);

                        // Logistics
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
                                                .eventTime(LocalDateTime.now().minusDays(3))
                                                .build());

                                shipmentEventRepository.save(com.example.dachuang.trace.entity.ShipmentEvent.builder()
                                                .shipmentNo(shipmentNo)
                                                .location("北京配送中心")
                                                .status("IN_TRANSIT")
                                                .details("到达北京")
                                                .eventTime(LocalDateTime.now().minusDays(1))
                                                .build());

                                shipmentEventRepository.save(com.example.dachuang.trace.entity.ShipmentEvent.builder()
                                                .shipmentNo(shipmentNo)
                                                .location("北京大药房")
                                                .status("DELIVERED")
                                                .details("客户已签收")
                                                .eventTime(LocalDateTime.now().minusHours(2))
                                                .build());
                        }
                }

                // 3. New Chain: Yunnan Sanqi (云南三七)
                String sanqiBatchNo = "MOCK-TRX-001";
                if (batchRepository.findByBatchNo(sanqiBatchNo).isEmpty()) {
                        com.example.dachuang.trace.entity.Batch sBatch = com.example.dachuang.trace.entity.Batch
                                        .builder()
                                        .ownerUserId(farmerId)
                                        .batchNo(sanqiBatchNo)
                                        .minCode("MC-TRX-001")
                                        .name("文山三七 (模拟数据)")
                                        .category("根茎类")
                                        .origin("云南省文山州")
                                        .status("PLANTING")
                                        .quantity(800.0)
                                        .unit("kg")
                                        .gs1LotNo("BATCH-TRX-001")
                                        .gs1Code(gs1Service.generateGs1HRI("BATCH-TRX-001", 800.0, "kg"))
                                        .gs1Locked(true)
                                        .description("云南文山高山三七，三年生")
                                        .build();
                        batchRepository.save(sBatch);

                        LocalDateTime now = LocalDateTime.now();

                        plantingRecordRepository.save(com.example.dachuang.trace.entity.PlantingRecord.builder()
                                        .batchNo(sanqiBatchNo)
                                        .operation("土地整理")
                                        .details("深耕30cm，施入基肥")
                                        .operator("王农户")
                                        .fieldName("文山二号山地")
                                        .build());

                        plantingRecordRepository.save(com.example.dachuang.trace.entity.PlantingRecord.builder()
                                        .batchNo(sanqiBatchNo)
                                        .operation("移栽")
                                        .details("雨后移栽，成活率高")
                                        .operator("王农户")
                                        .fieldName("文山二号山地")
                                        .build());

                        String sanqiProcBatchNo = "MOCK-TRX-001-P";
                        com.example.dachuang.trace.entity.Batch spBatch = com.example.dachuang.trace.entity.Batch
                                        .builder()
                                        .ownerUserId(farmerId)
                                        .batchNo(sanqiProcBatchNo)
                                        .minCode("MC-TRX-001-P")
                                        .name("三七粉精品装 (模拟数据)")
                                        .category("加工粉末")
                                        .origin("云南三七加工中心")
                                        .status("PROCESSING")
                                        .quantity(120.0)
                                        .unit("kg")
                                        .gs1LotNo("BATCH-TRX-001-P")
                                        .gs1Code(gs1Service.generateGs1HRI("BATCH-TRX-001-P", 120.0, "kg"))
                                        .gs1Locked(true)
                                        .description("超微粉碎工艺，吸收更快")
                                        .build();
                        batchRepository.save(spBatch);

                        processingRecordRepository.save(com.example.dachuang.trace.entity.ProcessingRecord.builder()
                                        .batchNo(sanqiProcBatchNo)
                                        .parentBatchNo(sanqiBatchNo)
                                        .processType("干燥")
                                        .factory("文山联合工厂")
                                        .operator("陈工")
                                        .details("真空冷冻干燥，温度控制在-40度")
                                        .build());

                        processingRecordRepository.save(com.example.dachuang.trace.entity.ProcessingRecord.builder()
                                        .batchNo(sanqiProcBatchNo)
                                        .parentBatchNo(sanqiBatchNo)
                                        .processType("超微粉碎")
                                        .factory("文山联合工厂")
                                        .operator("刘工")
                                        .details("粒径达到300目以上")
                                        .build());

                        batchLineageRepository.save(com.example.dachuang.trace.entity.BatchLineage.builder()
                                        .parentBatchNo(sanqiBatchNo)
                                        .childBatchNo(sanqiProcBatchNo)
                                        .stage("PROCESSING")
                                        .processType("超微粉碎")
                                        .build());

                        inspectionRecordRepository.save(com.example.dachuang.trace.entity.InspectionRecord.builder()
                                        .batchNo(sanqiProcBatchNo)
                                        .result("优级 (Grade S)")
                                        .inspector("陈质检")
                                        .reportUrl("https://example.com/report/sanqi001.pdf")
                                        .build());

                        String sShipmentNo = "SH-TRX-2024001";
                        shipmentRepository.save(com.example.dachuang.trace.entity.Shipment.builder()
                                        .shipmentNo(sShipmentNo)
                                        .batchNo(sanqiProcBatchNo)
                                        .distributorName("广州药材市场")
                                        .carrier("京东物流")
                                        .trackingNo("JD2024998877")
                                        .status("IN_TRANSIT")
                                        .remarks("高价值货物，注意防潮")
                                        .build());

                        shipmentEventRepository.save(com.example.dachuang.trace.entity.ShipmentEvent.builder()
                                        .shipmentNo(sShipmentNo)
                                        .location("云南文山分拨中心")
                                        .status("IN_TRANSIT")
                                        .details("已装车，准备发往广州")
                                        .eventTime(now.plusHours(2))
                                        .build());

                        log.info("Mock Sanqi Data Created: {}", sanqiBatchNo);
                }
        }
}
