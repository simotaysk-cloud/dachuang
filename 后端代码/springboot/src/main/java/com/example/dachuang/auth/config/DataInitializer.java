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
        // Dev-only: keep default accounts usable even if the DB already contains old rows.
        ensureDefaultUser("admin", "123456", "ADMIN", "系统管理员", "dummy_admin");
        ensureDefaultUser("farmer", "123456", "FARMER", "示范农户", "dummy_farmer");
        log.info("Default dev accounts ensured: admin/farmer (password: 123456)");
    }

    private void ensureDefaultUser(String username, String password, String role, String nickname, String openid) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            userRepository.save(User.builder()
                    .username(username)
                    .password(password)
                    .role(role)
                    .nickname(nickname)
                    .openid(openid)
                    .build());
            return;
        }

        // Ensure fields for login and NOT NULL constraints.
        user.setPassword(password);
        user.setRole(role);
        if (user.getNickname() == null || user.getNickname().isBlank()) {
            user.setNickname(nickname);
        }
        if (user.getOpenid() == null || user.getOpenid().isBlank()) {
            user.setOpenid(openid);
        }
        userRepository.save(user);
    }
}
