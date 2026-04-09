# 后端代码

本目录包含"药途寻迹"中药材溯源系统的后端服务代码。

## 目录结构

```
后端代码/
└── springboot/     # Spring Boot 后端主项目
```

## 技术栈

| 技术 | 说明 |
|------|------|
| Spring Boot 3.2.2 | 主框架 |
| Spring Data JPA | ORM / 数据库访问 |
| MySQL 8.0+ | 主数据库 |
| Flyway | 数据库版本管理 |
| JWT (JJWT 0.11.5) | 身份认证 |
| web3j | EVM 区块链集成（可选） |
| Maven | 构建工具 |

## 服务端口

后端默认监听 **8091** 端口。

## 快速开始

详细启动说明请参阅 [`springboot/README.md`](springboot/README.md)。

```bash
# 进入项目目录
cd springboot

# 打包
mvn clean package -DskipTests

# 启动
java -jar target/dachuang-*.jar
```

## 默认演示账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | 123456 | 管理员 |
| farmer | 123456 | 种植户 |
| factory | 123456 | 工厂 |
| logistics | 123456 | 物流 |
| inspector | 123456 | 检验员 |
