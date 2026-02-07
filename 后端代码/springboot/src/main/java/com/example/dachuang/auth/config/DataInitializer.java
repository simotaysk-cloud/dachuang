package com.example.dachuang.auth.config;

import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .password("123456") // dev only
                    .role("ADMIN")
                    .nickname("系统管理员")
                    .openid("dummy_admin")
                    .build();
            userRepository.save(admin);
            log.info("Default admin account created: admin / 123456");
        }

        // 也可以顺便初始化一个农户账号方便测试
        if (userRepository.findByUsername("farmer").isEmpty()) {
            User farmer = User.builder()
                    .username("farmer")
                    .password("123456")
                    .role("FARMER")
                    .nickname("示范农户")
                    .openid("dummy_farmer")
                    .build();
            userRepository.save(farmer);
            log.info("Default farmer account created: farmer / 123456");
        }
    }
}
