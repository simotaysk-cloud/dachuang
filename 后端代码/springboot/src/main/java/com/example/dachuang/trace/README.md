# trace — 核心溯源业务模块

本模块是系统最核心的业务模块，负责中药材从种植到消费者的全链路溯源数据管理，包括批次管理、种植记录、加工记录、质量检验和物流追踪。

## 包结构

```
trace/
├── controller/     # REST 接口层
├── dto/            # 请求与响应数据传输对象
├── entity/         # 数据库实体类
├── repository/     # 数据库访问接口（Spring Data JPA）
└── service/        # 业务逻辑层
```

## 业务模型

### 数据流向

```
Batch（批次）
  ├── PlantingRecord（种植记录）   —— 产地、种植周期、凭证图片
  ├── ProcessingRecord（加工记录）—— 加工工厂、产线、加工日期
  ├── InspectionRecord（检验记录）—— 检验机构、检验项目、结论
  └── LogisticsRecord（物流记录）
        └── ShipmentEvent（物流事件）—— 实时坐标、温度、状态更新
```

### 主要实体

| 实体 | 表名 | 说明 |
|------|------|------|
| `Batch` | `batch` | 批次主表，包含品名、重量、GS1 条码、区块链存证状态 |
| `PlantingRecord` | `planting_record` | 种植环节记录，关联批次 |
| `ProcessingRecord` | `processing_record` | 加工环节记录，含产线信息 |
| `InspectionRecord` | `inspection_record` | 质量检验记录，含检验结论 |
| `LogisticsRecord` | `logistics_record` | 物流主记录 |
| `ShipmentEvent` | `shipment_event` | 物流事件明细，含 GPS 坐标 |

## 主要接口

### 批次管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/trace/batches` | 批次列表（支持分页、关键字搜索） |
| POST | `/trace/batches` | 创建新批次 |
| GET  | `/trace/batches/{id}` | 批次详情 |
| PUT  | `/trace/batches/{id}` | 更新批次信息 |

### 溯源查询（公开接口，无需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/trace/query/{code}` | 通过溯源码查询完整链路信息 |

### 各环节记录

| 环节 | 路径前缀 | 说明 |
|------|----------|------|
| 种植 | `/trace/planting` | 种植记录 CRUD |
| 加工 | `/trace/processing` | 加工记录 CRUD |
| 检验 | `/trace/inspection` | 检验记录 CRUD |
| 物流 | `/trace/logistics` | 物流记录 CRUD |
| 物流事件 | `/trace/shipment-events` | 物流节点事件上报 |

## 权限控制

各接口根据操作类型限制角色：

- 种植记录写入：`FARMER`、`ADMIN`
- 加工记录写入：`FACTORY`、`ADMIN`
- 检验记录写入：`INSPECTOR`、`ADMIN`
- 物流记录写入：`LOGISTICS`、`ADMIN`
- 全部只读查询：所有已登录角色 + 消费者溯源查询接口（匿名）
