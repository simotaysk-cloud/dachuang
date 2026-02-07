package com.example.dachuang.auth.controller;

import com.example.dachuang.auth.dto.CreateUserRequest;
import com.example.dachuang.auth.dto.UpdateUserRequest;
import com.example.dachuang.auth.dto.UserResponse;
import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.service.UserService;
import com.example.dachuang.common.api.Result;
import com.example.dachuang.common.exception.BusinessException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    private void requireAdmin(HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        if (!"ADMIN".equals(role)) {
            throw new BusinessException(403, "Forbidden");
        }
    }

    @GetMapping
    public Result<List<UserResponse>> getAll(HttpServletRequest request) {
        requireAdmin(request);
        List<UserResponse> users = userService.getAllUsers().stream()
                .map(u -> UserResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .role(u.getRole())
                        .nickname(u.getNickname())
                        .name(u.getName())
                        .phone(u.getPhone())
                        .createdAt(u.getCreatedAt())
                        .updatedAt(u.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
        return Result.success(users);
    }

    @PostMapping
    public Result<UserResponse> create(HttpServletRequest request, @Valid @RequestBody CreateUserRequest body) {
        requireAdmin(request);
        User created = userService.createUser(User.builder()
                .username(body.getUsername())
                .password(body.getPassword())
                .role(body.getRole())
                .nickname(body.getNickname())
                .name(body.getName())
                .phone(body.getPhone())
                // Keep it always populated for legacy schemas.
                .openid("mock_openid_" + body.getUsername())
                .build());
        return Result.success(UserResponse.builder()
                .id(created.getId())
                .username(created.getUsername())
                .role(created.getRole())
                .nickname(created.getNickname())
                .name(created.getName())
                .phone(created.getPhone())
                .createdAt(created.getCreatedAt())
                .updatedAt(created.getUpdatedAt())
                .build());
    }

    @PutMapping("/{id}")
    public Result<UserResponse> update(HttpServletRequest request, @PathVariable Long id, @RequestBody UpdateUserRequest body) {
        requireAdmin(request);
        User updated = userService.updateUser(id, User.builder()
                .password(body.getPassword())
                .role(body.getRole())
                .nickname(body.getNickname())
                .name(body.getName())
                .phone(body.getPhone())
                .build());
        return Result.success(UserResponse.builder()
                .id(updated.getId())
                .username(updated.getUsername())
                .role(updated.getRole())
                .nickname(updated.getNickname())
                .name(updated.getName())
                .phone(updated.getPhone())
                .createdAt(updated.getCreatedAt())
                .updatedAt(updated.getUpdatedAt())
                .build());
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(HttpServletRequest request, @PathVariable Long id) {
        requireAdmin(request);
        userService.deleteUser(id);
        return Result.success(null);
    }
}
