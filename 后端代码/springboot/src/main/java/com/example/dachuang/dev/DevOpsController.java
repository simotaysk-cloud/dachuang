package com.example.dachuang.dev;

import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dev/ops")
@Profile("dev")
@RequiredArgsConstructor
public class DevOpsController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/reset-manufacturer")
    public String resetManufacturer() {
        String username = "manufacturer";
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            user = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode("123456"))
                    .role("MANUFACTURER")
                    .nickname("合作加工厂")
                    .openid("dummy_manufacturer")
                    .build();
            userRepository.save(user);
            return "Created manufacturer/123456";
        } else {
            user.setPassword(passwordEncoder.encode("123456"));
            user.setRole("MANUFACTURER");
            userRepository.save(user);
            return "Reset manufacturer/123456";
        }
    }
}
