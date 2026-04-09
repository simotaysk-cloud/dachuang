# scripts — 运维与开发脚本

本目录包含后端服务的开发辅助、演示数据重置与生产部署脚本。

## 脚本说明

| 文件 | 用途 |
|------|------|
| `dev-run.sh` | 本地开发模式启动（前台运行，日志直接输出到终端） |
| `dev-run-bg.sh` | 本地开发模式启动（后台运行，日志写入文件） |
| `run-evm-dev.sh` | 启用真实 EVM 区块链模式的开发启动脚本 |
| `reset_demo_db.sh` | 一键重置数据库并重新注入演示数据（Shell 版本） |
| `reset_demo_db.sql` | 演示数据 SQL 脚本（可单独执行） |
| `deploy-remote.sh` | 远程服务器部署脚本（构建 JAR 并上传至生产服务器） |

## 常用操作

### 本地开发启动

```bash
# 前台启动（推荐调试时使用）
bash dev-run.sh

# 后台启动
bash dev-run-bg.sh
```

### 启用 EVM 区块链

```bash
# 需提前配置 EVM_RPC_URL 和 EVM_PRIVATE_KEY 环境变量
bash run-evm-dev.sh
```

### 重置演示数据库

```bash
# 警告：此操作会清空现有数据，仅用于演示/测试环境！
bash reset_demo_db.sh
```

或直接在 MySQL 客户端中执行 `reset_demo_db.sql`。

### 部署到生产服务器

```bash
bash deploy-remote.sh
```

> 部署前请确认 `deploy-remote.sh` 中的服务器地址、用户名和目标路径配置正确。
