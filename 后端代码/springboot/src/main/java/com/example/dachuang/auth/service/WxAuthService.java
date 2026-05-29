package com.example.dachuang.auth.service;

import com.example.dachuang.auth.dto.AuthResponse;
import com.example.dachuang.auth.dto.UserProfileResponse;
import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.repository.UserRepository;
import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.common.util.PhoneMaskUtil;
import com.example.dachuang.config.WxProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WxAuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final WxProperties wxProperties;

    public String getSecretByAppid(String appid) {
        if (appid == null || wxProperties.getConfigs() == null) {
            return null;
        }
        return wxProperties.getConfigs().values().stream()
                .filter(c -> appid.equals(c.getAppid()))
                .map(WxProperties.Config::getSecret)
                .findFirst()
                .orElse(null);
    }

    public AuthResponse login(String username, String password) {
        log.info("Login attempt - username: [{}], password length: {}", username,
                password != null ? password.length() : 0);


        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("Login failed: User not found [{}]", username);
                    return new BusinessException(401, "Username or password incorrect");
                });

        String stored = user.getPassword() == null ? "" : user.getPassword();
        boolean ok = passwordEncoder.matches(password, stored);


        if (!ok && !stored.startsWith("$2a$") && !stored.startsWith("$2b$") && !stored.startsWith("$2y$")) {
            ok = stored.equals(password);
            if (ok) {
                user.setPassword(passwordEncoder.encode(password));
                userRepository.save(user);
            }
        }

        if (!ok) {
            log.warn("Login failed: Password mismatch for user [{}]", username);


            throw new BusinessException(401, "Username or password incorrect");
        }

        String token = jwtService.generateToken(user.getUsername(), user.getRole());
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    public UserProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(404, "User not found"));
        return UserProfileResponse.builder()
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .name(user.getName())
                .phone(PhoneMaskUtil.mask(user.getPhone()))
                .build();
    }
}
