# blockchain — 区块链存证模块

本模块实现中药材批次数据的区块链存证功能，支持两种运行模式：开发/演示用的 **MOCK 模式** 与接入真实 EVM 兼容链的 **EVM 模式**。

## 功能说明

- 在批次创建时自动将核心数据（批次 ID、品名、时间戳）锚定上链
- 查询指定批次的区块链存证记录（交易哈希、区块高度、链 ID）
- 支持 Ethereum、BSC（币安智能链）、Polygon 等所有 EVM 兼容链
- MOCK 模式下生成模拟哈希，无需真实链，适合演示

## 包结构

```
blockchain/
├── BlockchainController.java       # REST 接口（/blockchain/* 路由）
├── BlockchainService.java          # 存证业务逻辑
├── BlockchainMode.java             # 模式枚举（MOCK / EVM）
├── EvmBlockchainClient.java        # EVM 链交互客户端（基于 web3j）
├── BlockchainRecord.java           # 存证记录实体（数据库持久化）
└── BlockchainRecordRepository.java # 存证记录数据库访问接口
```

## 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/blockchain/record/{batchId}` | 查询指定批次的存证信息 |
| POST | `/blockchain/anchor/{batchId}` | 手动触发批次上链存证 |

## 运行模式配置

在 `application-dev.yml` 或环境变量中配置：

```yaml
blockchain:
  mode: MOCK   # MOCK（默认）或 EVM
  evm:
    rpc-url: https://sepolia.infura.io/v3/YOUR_KEY
    private-key: 0xYOUR_PRIVATE_KEY
```

或通过环境变量：

```bash
export BLOCKCHAIN_MODE=EVM
export EVM_RPC_URL=https://...
export EVM_PRIVATE_KEY=0x...
```

> 生产环境建议使用环境变量注入私钥，避免明文写入配置文件。
