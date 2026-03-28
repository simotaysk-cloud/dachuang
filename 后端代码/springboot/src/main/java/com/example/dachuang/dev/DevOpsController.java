package com.example.dachuang.dev;

import com.example.dachuang.auth.repository.UserRepository;
import com.example.dachuang.trace.service.BatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/dev/ops")
@Profile("dev")
@RequiredArgsConstructor
public class DevOpsController {

    private static final Logger log = LoggerFactory.getLogger(DevOpsController.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BulkSeederService bulkSeederService;

    @GetMapping("/seed-professional")
    public String seedProfessional() {
        new Thread(() -> {
            log.info("Manual professional seeding triggered via controller...");
            try {
                bulkSeederService.seedData(8);
            } catch (Exception e) {
                log.error("Manual professional seeding failed", e);
            }
        }, "manual-seeding-thread").start();
        return "Manual professional seeding triggered (8 chains). Please wait ~5 seconds and refresh.";
    }

    @GetMapping("/reset-manufacturer")
    public String resetManufacturer(@RequestParam(defaultValue = "123456") String password) {
        log.info("Resetting manufacturer account...");
        com.example.dachuang.auth.entity.User user = userRepository.findByUsername("manufacturer").orElse(null);
        if (user != null) {
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
        }
        com.example.dachuang.auth.entity.User farmer = userRepository.findByUsername("farmer").orElse(null);
        if (farmer != null) {
            farmer.setPassword(passwordEncoder.encode(password));
            userRepository.save(farmer);
        }
        return "Accounts 'manufacturer' and 'farmer' reset to provided password (default: 123456)";
    }
}
