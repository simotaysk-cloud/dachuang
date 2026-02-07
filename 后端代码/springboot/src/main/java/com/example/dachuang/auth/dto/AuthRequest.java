package com.example.dachuang.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {
    @NotBlank(message = "username cannot be blank")
    private String username;

    @NotBlank(message = "password cannot be blank")
    private String password;
}
