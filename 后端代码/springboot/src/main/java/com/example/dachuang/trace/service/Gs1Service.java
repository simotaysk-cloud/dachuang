package com.example.dachuang.trace.service;

import org.springframework.stereotype.Service;

@Service
public class Gs1Service {

    /**
     * Generate GS1-128 Human Readable Interpretation (HRI)
     * e.g. (01)06912345678901(10)BATCH001(3102)000050
     */
    public String generateGs1HRI(String lotNo, Double quantity, String unit) {
        String sanitizedLot = sanitizeLotNo(lotNo);
        StringBuilder sb = new StringBuilder();

        sb.append("(01)").append(generateGtin());
        sb.append("(10)").append(sanitizedLot);

        if (quantity != null) {
            double weightInKg = convertToKg(quantity, unit);
            // AI 3102 means "Net weight in kg, 2 decimal places"
            sb.append("(3102)").append(formatWeight(weightInKg));
        }

        return sb.toString();
    }

    public String sanitizeLotNo(String lotNo) {
        if (lotNo == null)
            return "NA";
        // GS1-128 AI(10) allows up to 20 characters (alphanumeric, -, etc.)
        String sanitized = lotNo.replaceAll("[^a-zA-Z0-9-]", "");
        if (sanitized.length() > 20) {
            sanitized = sanitized.substring(0, 20);
        }
        return sanitized;
    }

    private double convertToKg(Double quantity, String unit) {
        if (unit == null || unit.isBlank())
            return quantity;
        String u = unit.toLowerCase().trim();
        switch (u) {
            case "g":
            case "gram":
            case "克":
                return quantity / 1000.0;
            case "t":
            case "ton":
            case "吨":
                return quantity * 1000.0;
            case "jin":
            case "斤":
                return quantity * 0.5;
            default:
                return quantity; // Default assume Kg
        }
    }

    private String generateGtin() {
        return "06912345678901";
    }

    private String formatWeight(Double weight) {
        // AI 3102 -> 2 decimal places. e.g. 50.00 -> 005000 (total 6 digits)
        long val = Math.round(weight * 100);
        if (val > 999999)
            val = 999999;
        return String.format("%06d", val);
    }
}
