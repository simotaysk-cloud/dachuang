package com.example.dachuang.trace.service;

import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.repository.UserRepository;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.entity.BatchLineage;
import com.example.dachuang.trace.repository.BatchRepository;
import com.example.dachuang.trace.repository.BatchLineageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class BatchService {

    private final BatchRepository batchRepository;
    private final BatchLineageRepository batchLineageRepository;
    private final Gs1Service gs1Service;
    private final UserRepository userRepository;
    private final com.example.dachuang.blockchain.BlockchainService blockchainService;

    @Value("${app.blockchain.auto-anchor-on-batch-create:false}")
    private boolean autoAnchorOnBatchCreate;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.BASIC_ISO_DATE; // yyyyMMdd

    public List<Batch> getAllBatches() {
        return batchRepository.findAll();
    }

    public Batch getBatchByNo(String batchNo) {
        return batchRepository.findByBatchNo(batchNo)
                .orElseThrow(() -> new BusinessException(404, "Batch not found"));
    }

    public Batch createBatch(Batch batch) {
        // Backwards-compatible path (used by dev seeders). Treat as ADMIN/system.
        return createBatch(batch, "admin", "ADMIN");
    }

    public Batch createBatch(Batch batch, String username, String role) {
        if (batch == null) {
            throw new BusinessException(400, "Invalid batch payload");
        }

        // Ownership: default to the authenticated user.
        if (batch.getOwnerUserId() == null) {
            User u = userRepository.findByUsername(username)
                    .orElseThrow(() -> new BusinessException(401, "User not found"));
            batch.setOwnerUserId(u.getId());
        }

        // Batch number: farmers typically don't type it; backend generates a unique
        // one.
        String requestedNo = (batch.getBatchNo() == null) ? "" : batch.getBatchNo().trim();
        if (!"ADMIN".equalsIgnoreCase(role)) {
            requestedNo = ""; // ignore client-provided batchNo for non-admin
        }
        if (requestedNo.isBlank()) {
            batch.setBatchNo(generateBatchNo(username));
        } else {
            batch.setBatchNo(requestedNo);
        }

        if (batchRepository.findByBatchNo(batch.getBatchNo()).isPresent()) {
            throw new BusinessException(400, "Batch number already exists");
        }

        // 生成隐形码（如果未提供）
        if (batch.getMinCode() == null || batch.getMinCode().isBlank()) {
            batch.setMinCode(java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        }

        // Generate GS1 lot & code if not provided. Use a short unique lotNo for AI(10)
        // to avoid collisions.
        if (batch.getGs1LotNo() == null || batch.getGs1LotNo().isBlank()) {
            batch.setGs1LotNo(generateGs1LotNo(batch.getBatchNo()));
        }
        if (batch.getGs1Code() == null || batch.getGs1Code().isBlank()) {
            batch.setGs1Code(gs1Service.generateGs1HRI(batch.getGs1LotNo(), batch.getQuantity(), batch.getUnit()));
        }

        Batch saved = batchRepository.save(batch);

        // Optional: auto-anchor to blockchain in background (disabled by default to avoid unexpected gas cost).
        if (autoAnchorOnBatchCreate) {
            blockchainService.autoAnchor(saved.getBatchNo(), "Initial batch creation: " + saved.getName());
        }

        return saved;
    }

    public Batch deriveBatch(String parentBatchNo, String childBatchNo, String stage, String processType,
            String details) {
        Batch parent = getBatchByNo(parentBatchNo);

        String outputNo = childBatchNo;
        if (outputNo == null || outputNo.isBlank()) {
            outputNo = generateDerivedBatchNo(parentBatchNo, processType);
        }

        Batch child = batchRepository.findByBatchNo(outputNo).orElse(null);
        if (child == null) {
            Batch b = Batch.builder()
                    .ownerUserId(parent.getOwnerUserId())
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
            if (suffix.isBlank())
                suffix = "proc";
            if (suffix.length() > 12)
                suffix = suffix.substring(0, 12);
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

    private String generateBatchNo(String username) {
        String baseUser = (username == null) ? "user" : username.trim();
        if (baseUser.isBlank()) {
            baseUser = "user";
        }
        baseUser = baseUser.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "");
        if (baseUser.isBlank()) {
            baseUser = "USER";
        }
        if (baseUser.length() > 10) {
            baseUser = baseUser.substring(0, 10);
        }

        String day = LocalDate.now().format(DAY_FMT);
        String prefix = "B-" + baseUser + "-" + day;

        for (int i = 0; i < 50; i++) {
            String rand = Integer.toString(RANDOM.nextInt(36 * 36 * 36 * 36), 36);
            rand = String.format("%4s", rand).replace(' ', '0').toUpperCase(Locale.ROOT);
            String candidate = prefix + "-" + rand;
            if (batchRepository.findByBatchNo(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new BusinessException(500, "Failed to generate batch number");
    }

    public Batch updateBatch(Long id, Batch batchDetails) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "Batch not found"));

        batch.setName(batchDetails.getName());
        batch.setCategory(batchDetails.getCategory());
        batch.setOrigin(batchDetails.getOrigin());
        batch.setStatus(batchDetails.getStatus());
        batch.setDescription(batchDetails.getDescription());

        boolean locked = batch.isGs1Locked();
        if (locked) {
            boolean quantityChanged = batchDetails.getQuantity() != null
                    && (batch.getQuantity() == null || batchDetails.getQuantity().compareTo(batch.getQuantity()) != 0);
            boolean unitChanged = batchDetails.getUnit() != null
                    && (batch.getUnit() == null || !batchDetails.getUnit().equals(batch.getUnit()));
            if (quantityChanged || unitChanged) {
                throw new BusinessException(400, "GS1 is locked; cannot change quantity/unit after labeling");
            }
        } else {
            batch.setQuantity(batchDetails.getQuantity());
            batch.setUnit(batchDetails.getUnit());

            // Refresh GS1 HRI when quantity/unit changes, but keep lotNo stable once
            // created.
            if (batch.getGs1LotNo() == null || batch.getGs1LotNo().isBlank()) {
                batch.setGs1LotNo(generateGs1LotNo(batch.getBatchNo()));
            }
            batch.setGs1Code(gs1Service.generateGs1HRI(batch.getGs1LotNo(), batch.getQuantity(), batch.getUnit()));
        }

        return batchRepository.save(batch);
    }

    public Batch lockGs1ByBatchNo(String batchNo) {
        Batch batch = getBatchByNo(batchNo);
        batch.setGs1Locked(true);
        return batchRepository.save(batch);
    }

    private String generateGs1LotNo(String batchNo) {
        String base = gs1Service.sanitizeLotNo(batchNo);
        if (base != null && !base.isBlank() && !batchRepository.existsByGs1LotNo(base)) {
            return base;
        }

        String prefix = (base == null || base.isBlank()) ? "LOT" : base;
        if (prefix.length() > 12) {
            prefix = prefix.substring(0, 12);
        }

        for (int i = 0; i < 50; i++) {
            String rand = Integer.toString(RANDOM.nextInt(36 * 36 * 36 * 36 * 36 * 36 * 36), 36);
            rand = String.format("%7s", rand).replace(' ', '0');
            String candidate = prefix + "-" + rand;
            candidate = gs1Service.sanitizeLotNo(candidate);
            if (!batchRepository.existsByGs1LotNo(candidate)) {
                return candidate;
            }
        }
        throw new BusinessException(500, "Failed to generate GS1 lot number");
    }

    public void deleteBatch(Long id) {
        try {
            batchRepository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(400, "Batch is referenced by other records; cannot delete in demo mode");
        }
    }
}
