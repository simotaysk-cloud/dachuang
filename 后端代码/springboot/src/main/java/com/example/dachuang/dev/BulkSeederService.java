package com.example.dachuang.dev;

import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.repository.UserRepository;
import com.example.dachuang.trace.entity.*;
import com.example.dachuang.trace.repository.*;
import com.example.dachuang.trace.service.BatchService;
import com.example.dachuang.trace.service.Gs1Service;
import com.example.dachuang.blockchain.BlockchainRecord;
import com.example.dachuang.blockchain.BlockchainRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class BulkSeederService {

    private final BatchService batchService;
    private final BatchRepository batchRepository;
    private final PlantingRecordRepository plantingRecordRepository;
    private final ProcessingRecordRepository processingRecordRepository;
    private final BatchLineageRepository batchLineageRepository;
    private final UserRepository userRepository;
    private final BlockchainRecordRepository blockchainRecordRepository;

    private final Random random = new Random();

    private final InspectionRecordRepository inspectionRecordRepository;

    private final String[] HERB_NAMES = { "人参", "枸杞子", "当归", "杭菊", "陈皮", "三七", "黄芪", "白芍" };
    private final String[] ORIGINS = { "吉林抚松", "宁夏中宁", "甘肃岷县", "浙江桐乡", "广东新会", "云南文山", "甘肃陇西", "安徽亳州" };

    public void syncPendingBatches() {
        // ... (existing logic)
    }

    public void seedData(int count) {
        log.info("Starting professional manual backfill for existing batches...");
        User farmer = userRepository.findByUsername("farmer1")
                .or(() -> userRepository.findByUsername("farmer"))
                .orElseThrow(() -> new RuntimeException("Farmer user not found"));

        // ONLY patch existing batches based on user request
        patchExistingBatches(farmer);
        
        log.info("Professional manual backfill completed.");
    }

    @Transactional
    public void patchExistingBatches(User user) {
        log.info("Performing global backfill for existing herb batches...");
        for (String herb : HERB_NAMES) {
            List<Batch> matches = batchRepository.findAll().stream()
                    .filter(b -> b.getName() != null && b.getName().contains(herb))
                    .toList();
            
            for (Batch b : matches) {
                // Determine if it should have RAW or FINISHED based on category or lineage
                boolean isLeaf = batchLineageRepository.findAll().stream()
                        .noneMatch(l -> l.getParentBatchNo().equals(b.getBatchNo()));
                
                String type = isLeaf ? "FINISHED" : "RAW";
                
                boolean alreadyHas = inspectionRecordRepository.findAllByBatchNo(b.getBatchNo()).stream()
                        .anyMatch(ir -> type.equals(ir.getInspectionType()));
                
                if (!alreadyHas) {
                    inspectionRecordRepository.save(InspectionRecord.builder()
                            .batchNo(b.getBatchNo())
                            .inspectionType(type)
                            .result(getHerbSpecificResult(herb))
                            .reportUrl("https://cpuzhbc.cn/reports/qr-" + b.getBatchNo() + ".pdf")
                            .inspector("省检中心张工")
                            .build());
                    log.info("Patched {} record for batch: {}", type, b.getBatchNo());
                }
            }
        }
    }

    private void createFullChain(int index, User user) {
        String herb = HERB_NAMES[random.nextInt(HERB_NAMES.length)];
        String origin = ORIGINS[random.nextInt(ORIGINS.length)];

        // 1. Root Planting Batch
        Batch pBatch = Batch.builder()
                .name(herb + "药材")
                .category("中药材")
                .origin(origin + "标准化基地")
                .status("COMPLETED")
                .quantity(new BigDecimal(500 + random.nextInt(1000)))
                .unit("kg")
                .ownerUserId(user.getId())
                .description("专业种植示范基地 #" + index)
                .build();

        Batch savedP = batchService.createBatch(pBatch, user.getUsername(), user.getRole());

        // 2. Planting Record
        plantingRecordRepository.save(PlantingRecord.builder()
                .batchNo(savedP.getBatchNo())
                .operation("GAP规范采收")
                .details("严格遵循GAP标准，适时采收，确保药效成分积累达到峰值。")
                .operator("基地合伙人")
                .fieldName(origin + "示范区-" + (index % 3 + 1) + "号")
                .operationTime(LocalDateTime.now().minusDays(30))
                .build());

        // 2b. Raw Material Inspection (NEW)
        inspectionRecordRepository.save(InspectionRecord.builder()
                .batchNo(savedP.getBatchNo())
                .inspectionType("RAW")
                .result("【GAP收样初检】性状：符合规定；水分：10.5%；灰分：3.5%；重金属残留：未检出。")
                .reportUrl("https://cpuzhbc.cn/reports/raw-" + savedP.getBatchNo() + ".pdf")
                .inspector("基地初检员")
                .build());

        // 3. Derived Processing Batch
        Batch procBatch = Batch.builder()
                .name(herb + "饮片")
                .category("中药饮片")
                .origin(origin + "现代加工中心")
                .status("COMPLETED")
                .quantity(pBatch.getQuantity().multiply(new BigDecimal("0.8")))
                .unit("kg")
                .ownerUserId(user.getId())
                .description("从药材批次 " + savedP.getBatchNo() + " 衍生的精加工饮片")
                .build();

        Batch savedProc = batchService.createBatch(procBatch, user.getUsername(), user.getRole());

        // 4. Lineage
        batchLineageRepository.save(BatchLineage.builder()
                .parentBatchNo(savedP.getBatchNo())
                .childBatchNo(savedProc.getBatchNo())
                .stage("PROCESSING")
                .processType("净制、炮制、干燥")
                .details("标准化生产工艺：洗净去杂 -> 软化切片 -> 恒温干燥（无硫处理）")
                .build());

        // 5. Processing Record
        processingRecordRepository.save(ProcessingRecord.builder()
                .batchNo(savedProc.getBatchNo())
                .parentBatchNo(savedP.getBatchNo())
                .processType("GMP标准化加工")
                .factory(origin + "数字工厂")
                .operator("智能车间主管")
                .details("全自动化切片机处理，含水量精准控制。")
                .build());

        // 6. Finished Product Inspection
        inspectionRecordRepository.save(InspectionRecord.builder()
                .batchNo(savedProc.getBatchNo())
                .inspectionType("FINISHED")
                .result(getHerbSpecificResult(herb))
                .reportUrl("https://cpuzhbc.cn/reports/qr-" + savedProc.getBatchNo() + ".pdf")
                .inspector("省检中心张工")
                .build());
    }

    private String getHerbSpecificResult(String herb) {
        String base = "【2020版中国药典标准全检-合格】结论：符合规定。指标项：";
        switch (herb) {
            case "人参":
                return base + "人参皂苷 Rg1、Re 及 Rb1 总量：0.42% (限定≥0.30%)；水分：9.4% (限度≤12.0%)；总灰分：3.2% (限度≤4.2%)。";
            case "枸杞子":
                return base + "枸杞多糖：2.5% (限定≥1.8%)；外观：果形饱满, 色泽红润；二氧化硫残留：未检出。";
            case "当归":
                return base + "阿魏酸：0.092% (限定≥0.050%)；浸出物：56% (限定≥45.0%)；水分：11.2%。";
            case "杭菊":
                return base + "木犀草苷：0.11% (限定≥0.080%)；3,5-二咖啡酰奎宁酸：1.4% (限定≥0.70%)；性状：洁净, 气清香。";
            case "陈皮":
                return base + "橙皮苷：4.2% (限定≥3.5%)；含片：均匀条整, 气香浓郁；理化性质：符合药典及地方标准。";
            case "三七":
                return base + "三七皂苷 R1、人参皂苷 Rg1 及 Rb1 总量：7.2% (限定≥5.0%)；水分：10.5%；灰分：3.8%。";
            case "黄芪":
                return base + "黄芪甲苷：0.065% (限定≥0.040%)；浸出物：21% (限定≥17.0%)；性状：质硬而韧, 断面纤维性强。";
            case "白芍":
                return base + "芍药苷：3.2% (限定≥1.6%)；二氧化硫残留：未检出；重金属检测：Pb、Cd、Hg、As 均符合规定。";
            default:
                return base + "常规理化指标全检合格，包含性状、鉴别、检查及含量测定。";
        }
    }
}
