package com.example.dachuang;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class DachuangApplication {

    public static void main(String[] args) {
        // Force rebuild v3: 2026-03-28 20:35
        System.setProperty("java.awt.headless", "true");
        SpringApplication.run(DachuangApplication.class, args);
    }

}
