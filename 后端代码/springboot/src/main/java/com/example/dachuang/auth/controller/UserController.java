package com.example.dachuang.auth.controller;

import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.service.UserService;
import com.example.dachuang.common.api.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public Result<List<User>> getAll() {
        return Result.success(userService.getAllUsers());
    }

    @PostMapping
    public Result<User> create(@RequestBody User user) {
        return Result.success(userService.createUser(user));
    }

    @PutMapping("/{id}")
    public Result<User> update(@PathVariable Long id, @RequestBody User user) {
        return Result.success(userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success(null);
    }
}
