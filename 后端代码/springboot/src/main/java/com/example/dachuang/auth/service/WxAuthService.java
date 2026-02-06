package com.example.dachuang.auth.service;

import com.example.dachuang.auth.dto.AuthResponse;
import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

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

    public AuthResponse login(String code) {
        // In real scenario, call:
        // https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
        // For now, we mock the openid based on the code
        String openid = "mock_openid_" + code;

        Optional<User> userOptional = userRepository.findByOpenid(openid);
        if (userOptional.isEmpty()) {
            User newUser = User.builder()
                    .openid(openid)
                    .role("USER")
                    .build();
            userRepository.save(newUser);
        }

        String token = jwtService.generateToken(openid);
        return AuthResponse.builder()
                .token(token)
                .openid(openid)
                .build();
    }
}
