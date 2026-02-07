package com.example.dachuang.config;

import com.example.dachuang.auth.service.JwtService;
import com.example.dachuang.common.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtService jwtService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException(401, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        try {
            String username = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);
            request.setAttribute("username", username);
            request.setAttribute("role", role);
        } catch (Exception e) {
            throw new BusinessException(401, "Invalid token");
        }

        return true;
    }
}
