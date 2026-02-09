package com.example.dachuang.code;

import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.trace.entity.Batch;
import com.example.dachuang.trace.repository.BatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CodeService {

    private final BatchRepository batchRepository;

    public Map<String, String> generateDoubleCode(String batchNo) {
        Batch batch = batchRepository.findByBatchNo(batchNo)
                .orElseThrow(() -> new BusinessException(404, "Batch not found: " + batchNo));

        // Visible code: the traceability code that can be printed as QR (batchNo).
        // Invisible code: anti-counterfeit hidden code (minCode) stored in DB.
        String minCode = (batch.getMinCode() == null) ? "" : batch.getMinCode().trim();
        if (minCode.isBlank()) {
            minCode = generateUniqueMinCode();
            batch.setMinCode(minCode);
            batchRepository.save(batch);
        }

        return Map.of(
                "visibleCode", batch.getBatchNo(),
                "invisibleCode", minCode
        );
    }

    public VerifyResult verifyInvisibleCode(String invisibleCode) {
        String code = (invisibleCode == null) ? "" : invisibleCode.trim();
        if (code.isBlank()) {
            return new VerifyResult(false, "");
        }
        Batch b = batchRepository.findByMinCode(code).orElse(null);
        return new VerifyResult(b != null, b == null ? "" : b.getBatchNo());
    }

    private String generateUniqueMinCode() {
        // Keep it short for manual input, but still reasonably unique.
        for (int i = 0; i < 20; i++) {
            String c = UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
            if (batchRepository.findByMinCode(c).isEmpty()) {
                return c;
            }
        }
        throw new BusinessException(500, "Failed to generate minCode");
    }

    public record VerifyResult(boolean valid, String batchNo) {
    }
}
