# auth — 身份认证与授权模块

本模块负责系统的用户认证、角色管理与接口鉴权，基于 JWT 实现无状态认证，同时支持微信小程序 OpenID 登录。

## 功能说明

- 用户名/密码登录，颁发 JWT Token
- 微信小程序授权登录（通过微信 code 换取 OpenID）
- JWT Token 验证与过期处理
- 基于角色（RBAC）的接口访问控制
- 密码加密存储（BCrypt）

## 包结构

```
auth/
├── config/         # JWT 配置、密码加密 Bean 定义
├── controller/     # 登录接口（/auth/* 路由）
├── dto/            # 登录请求、Token 响应等数据结构
├── entity/         # 用户实体（User）
├── repository/     # 用户数据库访问接口
└── service/        # 认证业务逻辑（登录校验、Token 生成与解析）
```

## 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | 用户名密码登录，返回 JWT Token |
| POST | `/auth/wx-login` | 微信小程序 code 登录 |
| GET  | `/auth/me` | 获取当前登录用户信息 |

## 用户角色

系统内置以下角色：

| 角色值 | 说明 |
|--------|------|
| `ADMIN` | 管理员，拥有全部权限 |
| `FARMER` | 种植户 |
| `FACTORY` | 加工工厂 |
| `LOGISTICS` | 物流人员 |
| `INSPECTOR` | 质量检验员 |
| `REGULATOR` | 监管人员（只读） |

## JWT 配置

Token 有效期默认 **24 小时**，配置项位于 `application-dev.yml`：

```yaml
app:
  jwt:
    secret: YOUR_SECRET_KEY
    expiration: 86400000   # 毫秒
```
