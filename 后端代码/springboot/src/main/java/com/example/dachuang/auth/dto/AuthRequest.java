package com.example.dachuang.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {
    @NotBlank(message = "code cannot be blank")
    private String code;
}
