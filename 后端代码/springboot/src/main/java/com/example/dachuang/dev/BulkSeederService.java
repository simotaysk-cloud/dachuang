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

    private final String[] HERB_NAMES = { "长白山人参", "宁夏枸杞", "四川当归", "浙江杭菊", "广东陈皮", "云南三七", "甘肃黄芪", "安徽白芍" };
    private final String[] ORIGINS = { "长白山抚松县", "宁夏中宁县", "岷县", "桐乡市", "新会区", "文山市", "陇西县", "亳州市" };

    public void syncPendingBatches() {
        log.info("Starting sync of pending batches to blockchain...");
        int count = 0;
        Iterable<Batch> allBatches = batchRepository.findAll();
        for (Batch b : allBatches) {
            // Check if blockchain record exists with a txHash
            BlockchainRecord record = blockchainRecordRepository.findByBatchNo(b.getBatchNo()).orElse(null);
            if (record == null || record.getTxHash() == null || record.getTxHash().isBlank()) {
                try {
                    log.info("Syncing batch: {}", b.getBatchNo());
                    // Directly call recordOnChain (which is synchronized)
                    batchService.getBlockchainService().recordOnChain(b.getBatchNo(), "Manual sync: " + b.getName());
                    count++;
                    if (count % 10 == 0) {
                        log.info("Synced {} batches so far...", count);
                    }
                    // Delay between transactions to prevent nonce/RPC issues
                    Thread.sleep(1500);
                } catch (Exception e) {
                    log.error("Failed to sync batch {}: {}", b.getBatchNo(), e.getMessage());
                }
            }
        }
        log.info("Blockchain sync completed. Total synced: {}", count);
    }

    public void seedData(int count) {
        log.info("Starting bulk seeding for {} batches...", count);
        User farmer = userRepository.findByUsername("farmer")
                .orElseThrow(() -> new RuntimeException("Farmer user not found"));

        for (int i = 0; i < count; i++) {
            try {
                createFullChain(i, farmer);
                // Small delay to help blockchain nonce management and RPC stability
                Thread.sleep(300);
                if ((i + 1) % 10 == 0) {
                    log.info("Seeded {}/{} batches...", i + 1, count);
                }
            } catch (Exception e) {
                log.error("Failed to seed batch index {}: {}", i, e.getMessage());
            }
        }
        log.info("Bulk seeding completed.");
    }

    private void createFullChain(int index, User user) {
        String herb = HERB_NAMES[random.nextInt(HERB_NAMES.length)];
        String origin = ORIGINS[random.nextInt(ORIGINS.length)];

        // 1. Root Planting Batch
        Batch pBatch = Batch.builder()
                .name(herb + " (原始)")
                .category("根茎类")
                .origin(origin)
                .status("COMPLETED")
                .quantity(new BigDecimal(100 + random.nextInt(900)))
                .unit("jin")
                .ownerUserId(user.getId())
                .description("大生产环境下自动生成的种植记录批次 #" + index)
                .build();

        Batch savedP = batchService.createBatch(pBatch, user.getUsername(), user.getRole());

        // 2. Planting Record
        plantingRecordRepository.save(PlantingRecord.builder()
                .batchNo(savedP.getBatchNo())
                .operation("标准播种")
                .details("使用自动化播种机，深度统一")
                .operator("自动化采收组")
                .fieldName("规模化生产基地-" + (index % 5 + 1) + "号")
                .operationTime(LocalDateTime.now().minusDays(60))
                .build());

        // 3. Derived Processing Batch
        Batch procBatch = Batch.builder()
                .name(herb + " 精制片")
                .category("加工品")
                .origin(origin + "加工中心")
                .status("PROCESSING")
                .quantity(pBatch.getQuantity().divide(new BigDecimal("10"), 2, BigDecimal.ROUND_HALF_UP))
                .unit("kg")
                .ownerUserId(user.getId())
                .description("从种植批次 " + savedP.getBatchNo() + " 衍生的加工批次")
                .build();

        Batch savedProc = batchService.createBatch(procBatch, user.getUsername(), user.getRole());

        // 4. Lineage
        batchLineageRepository.save(BatchLineage.builder()
                .parentBatchNo(savedP.getBatchNo())
                .childBatchNo(savedProc.getBatchNo())
                .stage("PROCESSING")
                .processType("BATCH_CONVERSION")
                .details("整株脱水后初加工")
                .build());

        // 5. Processing Record
        processingRecordRepository.save(ProcessingRecord.builder()
                .batchNo(savedProc.getBatchNo())
                .parentBatchNo(savedP.getBatchNo())
                .processType("烘干切片")
                .factory(origin + "中央工厂")
                .operator("流水线机器人")
                .details("通过式热风循环烘干柜")
                .build());

    }
}
