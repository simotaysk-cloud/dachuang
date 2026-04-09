# config — Spring 全局配置模块

本模块包含系统级 Spring 配置类，负责拦截器注册、跨域配置、JPA 审计、密码加密等全局行为的初始化。

## 配置类说明

| 文件 | 说明 |
|------|------|
| `WebMvcConfig.java` | 注册 JWT 认证拦截器、配置跨域（CORS）规则、静态资源映射 |
| `AuthInterceptor.java` | JWT Token 校验拦截器，对需要登录的接口进行 Token 验证和用户信息注入 |
| `JpaConfig.java` | 启用 JPA 审计（`@EnableJpaAuditing`），支持 `BaseEntity` 的 `createdAt`/`updatedAt` 自动填充 |
| `PasswordConfig.java` | 注册 `BCryptPasswordEncoder` Bean，供认证模块加密/校验密码使用 |
| `WxProperties.java` | 微信小程序配置属性映射（AppID、AppSecret），绑定 `application.yml` 中的 `wx.*` 配置项 |

## 接口放行规则

以下路径无需 JWT Token，在 `WebMvcConfig` 中配置为白名单：

- `POST /auth/login`
- `POST /auth/wx-login`
- `GET /trace/query/**`（消费者端溯源查询，公开访问）
- `GET /static/**`（静态资源）

其余所有接口均需在请求头携带有效 Token：

```
Authorization: Bearer <token>
```
