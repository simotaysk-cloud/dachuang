package com.example.dachuang.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Data
@Configuration
@ConfigurationProperties(prefix = "wx")
public class WxProperties {

    /**
     * Map of app name (e.g., miniprogram5, consumer) to its WeChat config
     */
    private Map<String, Config> configs;

    @Data
    public static class Config {
        private String appid;
        private String secret;
    }
}
