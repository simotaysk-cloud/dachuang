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
                                        .quantity(BigDecimal.valueOf(500.0))
                                        .unit("jin")
                                        .gs1LotNo("BATCH001")
                                        .gs1Code(gs1Service.generateGs1HRI("BATCH001", BigDecimal.valueOf(500.0),
                                                        "jin"))
                                        .gs1Locked(true)
                                        .description("2024年春季种植示范批次")
                                        .imageUrl("https://images.unsplash.com/photo-1584017320005-27a3c7ea99f4?q=80&w=600&auto=format&fit=crop")
                                        .usageAdvice("建议每日3-5克，可切片含服、泡水或炖汤。建议早晨空腹服用，吸收效果更佳。")
                                        .contraindications("感冒发热、红肿热痛等实证热证患者忌服。不宜与萝卜、藜芦、五灵脂同食。")
                                        .commonPairings("1. 人参+当归：补气生血。\n2. 人参+枸杞：益精明目。\n3. 人参+红枣：健脾益气。")
                                        .build();
                        batchRepository.save(pBatch);

                        plantingRecordRepository.save(com.example.dachuang.trace.entity.PlantingRecord.builder()
                                        .batchNo(plantingBatchNo)
                                        .operation("播种")
                                        .details("选用优质人参种子，密度适中")
                                        .operator("李农户")
                                        .fieldName("一号示范田")
                                        .imageUrl("https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=400&auto=format&fit=crop")
                                        .build());

                        plantingRecordRepository.save(com.example.dachuang.trace.entity.PlantingRecord.builder()
                                        .batchNo(plantingBatchNo)
                                        .operation("施肥")
                                        .details("使用有机肥料，无农药")
                                        .operator("李农户")
                                        .fieldName("一号示范田")
                                        .imageUrl("https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?q=80&w=400&auto=format&fit=crop")
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
                                        .quantity(BigDecimal.valueOf(50.0))
                                        .unit("kg")
                                        .gs1LotNo("BATCH001-P")
                                        .gs1Code(gs1Service.generateGs1HRI("BATCH001-P", BigDecimal.valueOf(50.0),
                                                        "kg"))
                                        .gs1Locked(true)
                                        .description("经多道工序精制而成")
                                        .imageUrl("https://images.unsplash.com/photo-1611241893603-3c359704e0ee?q=80&w=600&auto=format&fit=crop")
                                        .usageAdvice("每次3克，每日1-2次。可用温开水冲服，或加入汤剂中。")
                                        .contraindications("孕妇慎用。经期停用。不宜与茶叶同服，以免降低药效。")
                                        .commonPairings("1. 三七+丹参：活血化瘀，通络止痛。\n2. 三七+西洋参：益气养阴，活血定痛。")
                                        .build();
                        batchRepository.save(procBatch);

                        processingRecordRepository.save(com.example.dachuang.trace.entity.ProcessingRecord.builder()
                                        .batchNo(processBatchNo)
                                        .parentBatchNo(plantingBatchNo)
                                        .processType("清洗")
                                        .factory("同仁堂吉林分厂")
                                        .operator("张工")
                                        .details("使用山泉水清洗，去土率99%")
                                        .imageUrl("https://images.unsplash.com/photo-1540320641830-4e26adefcc0c?q=80&w=400&auto=format&fit=crop")
                                        .build());

                        processingRecordRepository.save(com.example.dachuang.trace.entity.ProcessingRecord.builder()
                                        .batchNo(processBatchNo)
                                        .parentBatchNo(plantingBatchNo)
                                        .processType("切片烘干")
                                        .factory("同仁堂吉林分厂")
                                        .operator("王工")
                                        .details("低温烘干，保留活性成分")
                                        .imageUrl("https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400&auto=format&fit=crop")
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
                                        .quantity(BigDecimal.valueOf(800.0))
                                        .unit("kg")
                                        .gs1LotNo("BATCH-TRX-001")
                                        .gs1Code(gs1Service.generateGs1HRI("BATCH-TRX-001", BigDecimal.valueOf(800.0),
                                                        "kg"))
                                        .gs1Locked(true)
                                        .description("云南文山高山三七，三年生")
                                        .imageUrl("https://images.unsplash.com/photo-1512103002291-d24c80a48f42?q=80&w=600&auto=format&fit=crop")
                                        .usageAdvice("熟吃大补，生吃消肿。研末服用效果最佳。")
                                        .contraindications("血虚无瘀者慎用。孕妇禁用。")
                                        .commonPairings("1. 三七+山楂：降脂通脉。\n2. 三七+红景天：抗疲劳，增强体力。")
                                        .build();
                        batchRepository.save(sBatch);

                        LocalDateTime now = LocalDateTime.now();

                        plantingRecordRepository.save(com.example.dachuang.trace.entity.PlantingRecord.builder()
                                        .batchNo(sanqiBatchNo)
                                        .operation("土地整理")
                                        .details("深耕30cm，施入基肥")
                                        .operator("王农户")
                                        .fieldName("文山二号山地")
                                        .imageUrl("https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=400&auto=format&fit=crop")
                                        .build());

                        plantingRecordRepository.save(com.example.dachuang.trace.entity.PlantingRecord.builder()
                                        .batchNo(sanqiBatchNo)
                                        .operation("移栽")
                                        .details("雨后移栽，成活率高")
                                        .operator("王农户")
                                        .fieldName("文山二号山地")
                                        .imageUrl("https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=400&auto=format&fit=crop")
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
                                        .quantity(BigDecimal.valueOf(120.0))
                                        .unit("kg")
                                        .gs1LotNo("BATCH-TRX-001-P")
                                        .gs1Code(gs1Service.generateGs1HRI("BATCH-TRX-001-P", BigDecimal.valueOf(120.0),
                                                        "kg"))
                                        .gs1Locked(true)
                                        .description("超微粉碎工艺，吸收更快")
                                        .imageUrl("https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=600&auto=format&fit=crop")
                                        .usageAdvice("每日2次，每次2克。餐后温水送服。")
                                        .contraindications("阴虚内热者慎服。")
                                        .commonPairings("1. 三七粉+牛奶：早餐伴侣，补血养颜。\n2. 三七粉+蜂蜜：改善口感，润肺止痛。")
                                        .build();
                        batchRepository.save(spBatch);

                        processingRecordRepository.save(com.example.dachuang.trace.entity.ProcessingRecord.builder()
                                        .batchNo(sanqiProcBatchNo)
                                        .parentBatchNo(sanqiBatchNo)
                                        .processType("干燥")
                                        .factory("文山联合工厂")
                                        .operator("陈工")
                                        .details("真空冷冻干燥，温度控制在-40度")
                                        .imageUrl("https://images.unsplash.com/photo-1547514126-538466e38706?q=80&w=400&auto=format&fit=crop")
                                        .build());

                        processingRecordRepository.save(com.example.dachuang.trace.entity.ProcessingRecord.builder()
                                        .batchNo(sanqiProcBatchNo)
                                        .parentBatchNo(sanqiBatchNo)
                                        .processType("超微粉碎")
                                        .factory("文山联合工厂")
                                        .operator("刘工")
                                        .details("粒径达到300目以上")
                                        .imageUrl("https://images.unsplash.com/photo-1516746826332-ddc74a51ceac?q=80&w=400&auto=format&fit=crop")
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
