package com.example.dachuang.trace.service;

import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.entity.BatchLineage;
import com.example.dachuang.trace.repository.BatchRepository;
import com.example.dachuang.trace.repository.BatchLineageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class BatchService {

    private final BatchRepository batchRepository;
    private final BatchLineageRepository batchLineageRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    public List<Batch> getAllBatches() {
        return batchRepository.findAll();
    }

    public Batch getBatchByNo(String batchNo) {
        return batchRepository.findByBatchNo(batchNo)
                .orElseThrow(() -> new BusinessException(404, "Batch not found"));
    }

    public Batch createBatch(Batch batch) {
        if (batchRepository.findByBatchNo(batch.getBatchNo()).isPresent()) {
            throw new BusinessException(400, "Batch number already exists");
        }
        // 生成隐形码（如果未提供）
        if (batch.getMinCode() == null || batch.getMinCode().isBlank()) {
            batch.setMinCode(java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        }
        return batchRepository.save(batch);
    }

    public Batch deriveBatch(String parentBatchNo, String childBatchNo, String stage, String processType, String details) {
        Batch parent = getBatchByNo(parentBatchNo);

        String outputNo = childBatchNo;
        if (outputNo == null || outputNo.isBlank()) {
            outputNo = generateDerivedBatchNo(parentBatchNo, processType);
        }

        Batch child = batchRepository.findByBatchNo(outputNo).orElse(null);
        if (child == null) {
            Batch b = Batch.builder()
                    .batchNo(outputNo)
                    .minCode(null) // auto-generate
                    .name(parent.getName())
                    .category(parent.getCategory())
                    .origin(parent.getOrigin())
                    .status(parent.getStatus())
                    .description(parent.getDescription())
                    .build();
            child = createBatch(b);
        }

        // Ensure a child only has one parent (tree model for now)
        batchLineageRepository.findByChildBatchNo(child.getBatchNo()).ifPresent(existing -> {
            if (!existing.getParentBatchNo().equals(parentBatchNo)) {
                throw new BusinessException(400, "Child batch already derived from another parent");
            }
        });

        if (batchLineageRepository.findByChildBatchNo(child.getBatchNo()).isEmpty()) {
            batchLineageRepository.save(BatchLineage.builder()
                    .parentBatchNo(parentBatchNo)
                    .childBatchNo(child.getBatchNo())
                    .stage(stage)
                    .processType(processType)
                    .details(details)
                    .build());
        }

        return child;
    }

    public List<BatchLineage> getChildren(String parentBatchNo) {
        return batchLineageRepository.findAllByParentBatchNo(parentBatchNo);
    }

    public BatchLineage getParentEdge(String childBatchNo) {
        return batchLineageRepository.findByChildBatchNo(childBatchNo).orElse(null);
    }

    private String generateDerivedBatchNo(String parentBatchNo, String processType) {
        String base = parentBatchNo;
        String suffix = "proc";
        if (processType != null && !processType.isBlank()) {
            suffix = processType.trim()
                    .toLowerCase(Locale.ROOT)
                    .replaceAll("[^a-z0-9]+", "-")
                    .replaceAll("^-+|-+$", "");
            if (suffix.isBlank()) suffix = "proc";
            if (suffix.length() > 12) suffix = suffix.substring(0, 12);
        }

        for (int i = 0; i < 20; i++) {
            String rand = Integer.toString(RANDOM.nextInt(36 * 36 * 36 * 36 * 36), 36);
            rand = String.format("%5s", rand).replace(' ', '0');
            String candidate = base + "-" + suffix + "-" + rand;
            if (batchRepository.findByBatchNo(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new BusinessException(500, "Failed to generate derived batch number");
    }

    public Batch updateBatch(Long id, Batch batchDetails) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Batch not found"));

        batch.setName(batchDetails.getName());
        batch.setCategory(batchDetails.getCategory());
        batch.setOrigin(batchDetails.getOrigin());
        batch.setStatus(batchDetails.getStatus());
        batch.setDescription(batchDetails.getDescription());

        return batchRepository.save(batch);
    }

    public void deleteBatch(Long id) {
        batchRepository.deleteById(id);
    }
}
