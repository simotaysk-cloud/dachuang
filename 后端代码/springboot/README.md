# springboot — 后端服务

"药途寻迹"中药材溯源系统的 Spring Boot 后端，提供 RESTful API，支持多角色身份认证、全链路溯源数据管理、GS1-128 条码生成、区块链存证（可选）与 AI 问答接口。

## 目录结构

```
springboot/
├── src/main/java/com/example/dachuang/
│   ├── DachuangApplication.java    # 启动入口
│   ├── ai/                         # AI 中医专家接口模块
│   ├── auth/                       # 身份认证与授权模块
│   ├── blockchain/                 # 区块链存证模块
│   ├── code/                       # GS1-128 条码生成模块
│   ├── common/                     # 公共工具、基础类
│   ├── config/                     # Spring 全局配置
│   ├── controller/                 # 通用接口（文件上传等）
│   ├── dev/                        # 开发/演示数据工具
│   └── trace/                      # 核心溯源业务模块
├── src/main/resources/
│   ├── application.yml             # 主配置（激活 dev 环境）
│   ├── application-dev.yml         # 开发环境配置
│   └── db/migration/               # Flyway 数据库迁移脚本（V1-V13）
├── scripts/                        # 运维脚本
├── pom.xml                         # Maven 依赖配置
├── .env.example                    # 环境变量模板
└── DEPLOY_READY.md                 # 部署检查清单
```

## 环境要求

- JDK 17+
- MySQL 8.0+
- Maven 3.8+

## 本地开发启动

### 1. 准备数据库

```sql
CREATE DATABASE dachuang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dachuang'@'localhost' IDENTIFIED BY 'Dachuang123!';
GRANT ALL PRIVILEGES ON dachuang.* TO 'dachuang'@'localhost';
FLUSH PRIVILEGES;
```

Flyway 会在应用启动时自动执行 `db/migration/` 下的迁移脚本，无需手动建表。

### 2. 配置环境变量（可选）

复制 `.env.example` 为 `.env` 并按需修改，或直接修改 `application-dev.yml`。

### 3. 启动服务

```bash
# 编译
mvn clean package -DskipTests

# 启动（开发模式）
mvn spring-boot:run

# 或启动 JAR
java -jar target/dachuang-*.jar
```

服务启动后监听 **http://localhost:8091**。

### 4. 初始化演示数据

启动后访问以下接口自动生成完整演示数据：

```
POST http://localhost:8091/dev/seed
```

## 主要 API 模块

| 路径前缀 | 说明 |
|----------|------|
| `/auth/*` | 登录、微信授权、Token 刷新 |
| `/trace/*` | 批次、种植、加工、检验、物流 CRUD |
| `/code/*` | GS1-128 条码生成 |
| `/blockchain/*` | 区块链存证查询 |
| `/ai/*` | AI 中医专家问答 |
| `/file/*` | 图片/文件上传 |
| `/dev/*` | 开发工具（演示数据生成，生产环境应禁用） |

## 区块链配置

默认使用 **MOCK 模式**（本地模拟，无需真实链）。

启用 EVM 真实区块链：

```bash
# 设置环境变量后启动
export BLOCKCHAIN_MODE=EVM
export EVM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
export EVM_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
java -jar target/dachuang-*.jar
```

也可使用 `scripts/run-evm-dev.sh` 脚本一键启动。

## 数据库迁移说明

采用 Flyway 管理数据库版本，迁移脚本位于 `src/main/resources/db/migration/`：

| 版本 | 说明 |
|------|------|
| V1 | 初始表结构 |
| V2-V4 | 批次所有权、地理位置证据 |
| V5-V7 | 区块链支持、产线名称 |
| V8-V10 | 消费者字段扩展 |
| V11-V13 | 物流多批次支持、发货事件坐标 |

## 生产部署

参考 `DEPLOY_READY.md` 检查清单，以及 `scripts/deploy-remote.sh` 远程部署脚本。
