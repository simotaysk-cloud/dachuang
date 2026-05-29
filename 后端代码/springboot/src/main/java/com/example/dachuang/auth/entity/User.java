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
    private String role;

    @Column(length = 64)
    private String name;
    @Column(length = 32)
    private String phone;
    @Column(nullable = true, unique = true, length = 128)
    private String openid;
}
