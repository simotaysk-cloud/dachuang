package com.example.dachuang.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileResponse {
    private String openid;
    private String nickname;
    private String avatarUrl;
    private String role;
    private String name;
    private String phone;
}
