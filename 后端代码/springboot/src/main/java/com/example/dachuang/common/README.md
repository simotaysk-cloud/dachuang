# common — 公共基础模块

本模块提供系统各业务模块共用的工具类、基础实体、统一响应封装和全局异常处理。

## 包结构

```
common/
├── api/            # 统一 API 响应格式（Result<T>、错误码枚举）
├── entity/         # 基础实体类（BaseEntity，含 id、createdAt、updatedAt 公共字段）
├── exception/      # 自定义业务异常类与全局异常处理器
└── util/           # 通用工具方法（日期格式化、字符串处理等）
```

## 主要组件说明

### api — 统一响应格式

所有接口统一返回 `Result<T>` 包装对象：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### entity — 基础实体

`BaseEntity` 包含所有表共用的字段：
- `id`（自增主键）
- `createdAt`（创建时间，JPA 自动填充）
- `updatedAt`（更新时间，JPA 自动填充）

业务实体通过继承 `BaseEntity` 获得上述字段。

### exception — 异常处理

- `BusinessException`：业务逻辑异常，携带自定义错误码和消息
- `GlobalExceptionHandler`（`@RestControllerAdvice`）：统一捕获异常，转换为标准 `Result` 响应

### util — 工具类

通用辅助方法，供各模块直接调用，避免重复代码。
