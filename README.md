# 智汇本草 - 中药材全过程溯源管理系统

本项目是一款基于 **Spring Boot** 后端与 **微信小程序** 前端的工业级中药材溯源管理解决方案。旨在实现从种植、加工、质检到物流的全链路数字化追踪，并对接 **GS1-128 国际标准** 编码。

## 🌟 核心功能

- **多角色权限管理**：支持管理员 (Admin)、农户 (Farmer)、加工厂 (Factory)、物流 (Logistics) 及监管方 (Regulator) 的分权管理。
- **全流程存证**：涵盖种植、加工、质检、物流等环节的详细记录录入与展示。
- **GS1-128 国际标准**：
    - 自动生成合规的 GS1-128 HRI 编码。
    - 支持 `g/t/斤` 到 `kg` 的自动单位换算。
    - 具备 GS1 锁定机制，确保打印贴标后库存数据的一致性。
- **区块链对接准备**：内置区块链存证逻辑接口，支持溯源数据上链验证。
- **响应式 UI**：采用统一的“列表+卡片”设计语言，操作体验流畅。

## 🛠️ 技术栈

- **后端**：Spring Boot 3.2.2, Spring Data JPA, JWT (身份认证), MySQL 8.0+
- **前端**：微信小程序 (Vanilla WXML/WXSS/JS)
- **工具**：Maven, 微信开发者工具

## 🚀 快速开始

### 1. 后端部署 (Spring Boot)

1. **环境准备**：确认已安装 Java 17+ 和 MySQL 8.0+。
2. **创建数据库**：
   ```sql
   CREATE DATABASE dachuang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   或使用演示环境一键重建脚本（会 DROP 并重建数据库；适用于演示数据环境）：
   ```bash
   cd 后端代码/springboot
   bash scripts/reset_demo_db.sh
   ```
   > 如果你之前使用过旧版本（JPA 自动建表）生成过表结构，建议直接使用上述脚本重建库，避免 Flyway 与旧表结构冲突。
3. **配置修改**：修改 `后端代码/springboot/src/main/resources/application-dev.yml` 中的数据库账号密码：
   - 默认账号: `dachuang`
   - 默认密码: `Dachuang123!` (请根据实际情况调整)
   > 说明：当前数据库表结构由 **Flyway** 管理，后端启动时会自动执行迁移；JPA 仅做 `validate` 校验。
4. **运行服务**：
   ```bash
   cd 后端代码/springboot
   mvn spring-boot:run -DskipTests
   ```
   服务默认运行在 `http://127.0.0.1:8081`。

### 2. 前端部署 (微信小程序)

1. **导入项目**：使用微信开发者工具打开 `前端代码/miniprogram-5` 文件夹。
2. **修改配置**：
   - 打开 `前端代码/miniprogram-5/utils/api.js`，确认 `DEFAULT_BASE_URL` 指向您的后端地址（默认为 `http://127.0.0.1:8081`）。
   - 在开发者工具中勾选“详情 -> 本地设置 -> 不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书”。
3. **运行预览**：点击“编译”即可查看效果。

## 🔑 默认账号

系统启动时会自动初始化以下测试账号：
- **管理员**：`admin` / `123456`
- **农户**：`farmer` / `123456`

## 🧪 演示数据

系统内置了一套完整的“长白山人参”演示链路：
- 搜索批次号 `MOCK-2024001` 即可查看完整的溯源闭环。

## ⛓️ 区块链存证（真实上链）

默认是演示模式（`MOCK`），会生成假的 `txHash`。如果你要“真的上链”，后端已支持 **EVM 兼容链**（以以太坊测试网 Sepolia 为例；也可换成 BSC/Polygon/本地私链，只要是 JSON-RPC）。

### 1) 部署合约（一次性）

合约需要提供 `anchor(string batchNo, bytes32 dataHash)` 方法。你可以用 Remix 部署下面这个最小合约：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TraceAnchor {
    event Anchored(string batchNo, bytes32 dataHash, address indexed sender, uint256 timestamp);
    mapping(string => bytes32) public hashes;

    function anchor(string calldata batchNo, bytes32 dataHash) external {
        hashes[batchNo] = dataHash;
        emit Anchored(batchNo, dataHash, msg.sender, block.timestamp);
    }
}
```

部署完成后记录合约地址：`EVM_CONTRACT_ADDRESS`。

### 2) 配置后端（环境变量）

在启动后端前设置环境变量（不要把私钥提交到 git）：

```bash
export APP_BLOCKCHAIN_MODE=EVM
export EVM_RPC_URL="https://sepolia.infura.io/v3/xxx"   # 也可以是你自建节点的 http(s) rpc
export EVM_CHAIN_ID=11155111
export EVM_PRIVATE_KEY="0x..."                          # 部署/签名用账户私钥（仅用于演示）
export EVM_CONTRACT_ADDRESS="0x..."                     # 上一步部署的合约地址
export EVM_EXPLORER_TX_URL="https://sepolia.etherscan.io/tx/"
```

然后启动后端即可。

也可以用 `.env` 方式（避免把私钥写进配置或发到聊天里）：

1. 复制示例：`后端代码/springboot/.env.example` -> `后端代码/springboot/.env`
2. 填入 `EVM_RPC_URL / EVM_PRIVATE_KEY / EVM_CONTRACT_ADDRESS`
3. 启动：
```bash
cd 后端代码/springboot
bash scripts/run-evm-dev.sh
```

### 3) 小程序演示入口

小程序的“防伪&区块链”页面可以：
- `记录上链`：调用 `POST /api/v1/blockchain/record`，返回 `txHash/txUrl/dataHash`
- `查询上链`：调用 `GET /api/v1/blockchain/{batchNo}`，查看数据库里保存的上链信息

---
*本项目由 Antigravity AI 协作开发，致力于中药材产业数字化转型。*
