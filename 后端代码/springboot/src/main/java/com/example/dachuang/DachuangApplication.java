package com.example.dachuang;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class DachuangApplication {

    public static void main(String[] args) {
        SpringApplication.run(DachuangApplication.class, args);
    }

}
