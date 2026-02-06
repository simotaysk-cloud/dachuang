package com.example.dachuang.auth.controller;

import com.example.dachuang.auth.dto.AuthRequest;
import com.example.dachuang.auth.dto.AuthResponse;
import com.example.dachuang.auth.service.WxAuthService;
import com.example.dachuang.common.api.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final WxAuthService wxAuthService;

    @PostMapping("/wx-login")
    public Result<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = wxAuthService.login(request.getCode());
        return Result.success(response);
    }
}
