package com.example.dachuang.code;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class CodeService {

    public Map<String, String> generateDoubleCode(String batchNo) {
        Map<String, String> codes = new HashMap<>();
        codes.put("visibleCode", "v-" + batchNo + "-" + UUID.randomUUID().toString().substring(0, 8));
        codes.put("invisibleCode", "i-" + UUID.randomUUID().toString().substring(0, 12));
        return codes;
    }

    public boolean verifyInvisibleCode(String invisibleCode) {
        // Mocking verification logic
        return invisibleCode != null && invisibleCode.startsWith("i-");
    }
}
