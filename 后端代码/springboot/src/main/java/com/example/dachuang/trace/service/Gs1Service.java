package com.example.dachuang.trace.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class Gs1Service {


    public String generateGs1HRI(String lotNo, BigDecimal quantity, String unit) {
        String sanitizedLot = sanitizeLotNo(lotNo);
        StringBuilder sb = new StringBuilder();

        sb.append("(01)").append(generateGtin());
        sb.append("(10)").append(sanitizedLot);

        if (quantity != null) {
            BigDecimal weightInKg = convertToKg(quantity, unit);

            sb.append("(3102)").append(formatWeight(weightInKg));
        }

        return sb.toString();
    }

    public String sanitizeLotNo(String lotNo) {
        if (lotNo == null)
            return "NA";

        String sanitized = lotNo.replaceAll("[^a-zA-Z0-9-]", "");
        if (sanitized.length() > 20) {
            sanitized = sanitized.substring(0, 20);
        }
        return sanitized;
    }

    private BigDecimal convertToKg(BigDecimal quantity, String unit) {
        if (quantity == null) {
            return null;
        }
        if (unit == null || unit.isBlank()) {
            return quantity;
        }
        String u = unit.toLowerCase().trim();
        switch (u) {
            case "g":
            case "gram":
            case "克":
                return quantity.divide(new BigDecimal("1000"), 12, RoundingMode.HALF_UP);
            case "t":
            case "ton":
            case "吨":
                return quantity.multiply(new BigDecimal("1000"));
            case "jin":
            case "斤":
                return quantity.multiply(new BigDecimal("0.5"));
            default:
                return quantity;
        }
    }

    private String generateGtin() {
        return "06912345678901";
    }

    private String formatWeight(BigDecimal weight) {

        if (weight == null) {
            return "000000";
        }
        long val = weight
                .multiply(new BigDecimal("100"))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();
        if (val > 999999) {
            val = 999999;
        }
        if (val < 0) {
            val = 0;
        }
        return String.format("%06d", val);
    }
}
