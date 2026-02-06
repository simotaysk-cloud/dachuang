package com.example.dachuang.common.util;

public class PhoneMaskUtil {

    private PhoneMaskUtil() {}

    public static String mask(String phone) {
        if (phone == null || phone.isBlank()) {
            return "";
        }
        String digits = phone.trim();
        if (digits.length() < 7) {
            return digits;
        }
        return digits.substring(0, 3) + "****" + digits.substring(digits.length() - 4);
    }
}
