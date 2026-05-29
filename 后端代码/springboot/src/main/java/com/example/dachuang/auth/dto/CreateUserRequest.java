package com.example.dachuang.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank(message = "username cannot be blank")
    private String username;


    private String password;

    @NotBlank(message = "role cannot be blank")
    private String role;

    private String nickname;
    private String name;
    private String phone;
}

