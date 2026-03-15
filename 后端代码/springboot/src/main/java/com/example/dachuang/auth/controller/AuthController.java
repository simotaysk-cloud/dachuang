package com.example.dachuang.auth.controller;

import com.example.dachuang.auth.dto.AuthRequest;
import com.example.dachuang.auth.dto.AuthResponse;
import com.example.dachuang.auth.dto.UserProfileResponse;
import com.example.dachuang.auth.service.WxAuthService;
import com.example.dachuang.common.api.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final WxAuthService wxAuthService;

    @RequestMapping(value = "/login", method = {org.springframework.web.bind.annotation.RequestMethod.POST, org.springframework.web.bind.annotation.RequestMethod.GET})
    public Result<AuthResponse> login(@Valid @RequestBody(required = false) AuthRequest request, jakarta.servlet.http.HttpServletRequest httpServletRequest) {
        if ("GET".equalsIgnoreCase(httpServletRequest.getMethod())) {
            return Result.error(405, "Redirect detected (GET): Please check server SSL/Nginx configuration. Ensure you are using HTTP on Port 80 without redirects.");
        }
        AuthResponse response = wxAuthService.login(request.getUsername(), request.getPassword());
        return Result.success(response);
    }

    @GetMapping("/me")
    public Result<UserProfileResponse> me(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        return Result.success(wxAuthService.getProfile(username));
    }
}
