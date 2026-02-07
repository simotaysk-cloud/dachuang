package com.example.dachuang.auth.entity;

import com.example.dachuang.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "users",
        indexes = {
                @Index(name = "idx_users_openid", columnList = "openid")
        }
)
public class User extends BaseEntity {

    @Column(unique = true, nullable = false, length = 64)
    @NotBlank(message = "username cannot be blank")
    private String username;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "password cannot be blank")
    private String password;

    @Column(length = 64)
    private String nickname;
    @Column(length = 255)
    private String avatarUrl;
    @Column(nullable = false, length = 32)
    private String role; // ADMIN, USER, FARMER, etc.

    @Column(length = 64)
    private String name; // 真实姓名
    @Column(length = 32)
    private String phone; // 联系方式（需脱敏）
    @Column(nullable = true, unique = true, length = 128)
    private String openid; // 保留作为可选识别码
}
