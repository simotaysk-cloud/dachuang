package com.example.dachuang.auth.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String password; // optional; if blank, keep existing
    private String role;
    private String nickname;
    private String name;
    private String phone;
}

