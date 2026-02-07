package com.example.dachuang.auth.service;

import com.example.dachuang.auth.dto.AuthResponse;
import com.example.dachuang.auth.dto.UserProfileResponse;
import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.repository.UserRepository;
import com.example.dachuang.common.exception.BusinessException;
import com.example.dachuang.common.util.PhoneMaskUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WxAuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${wx.appid:mock-appid}")
    private String appid;

    @Value("${wx.secret:mock-secret}")
    private String secret;

    public AuthResponse login(String username, String password) {
        log.info("Login attempt - username: [{}], password length: {}", username,
                password != null ? password.length() : 0);

        // Find user by username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("Login failed: User not found [{}]", username);
                    return new BusinessException(401, "Username or password incorrect");
                });

        // Simple password check (In production, use BCrypt.checkPassword)
        if (!user.getPassword().equals(password)) {
            log.warn("Login failed: Password mismatch for user [{}]", username);
            // Optional: for dev, log characters if suspicious, but let's stick to lengths
            // for now
            throw new BusinessException(401, "Username or password incorrect");
        }

        String token = jwtService.generateToken(user.getUsername());
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
