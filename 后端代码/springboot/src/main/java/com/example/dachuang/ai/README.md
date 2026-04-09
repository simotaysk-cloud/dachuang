# ai — AI 中医专家模块

本模块提供 AI 中医专家问答功能，基于腾讯混元 Lite API，供消费者端小程序调用。

## 功能说明

- 接收用户输入的中医相关问题（症状、药材功效、用法禁忌等）
- 调用外部大语言模型 API 生成专业建议
- 以流式或非流式方式返回回答

## 包结构

```
ai/
├── controller/     # REST 接口层（/ai/* 路由）
└── dto/            # 请求与响应数据结构
```

## 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/ai/chat` | 发送问题，获取 AI 中医专家回答 |

## 配置

AI 服务地址与密钥在 `application-dev.yml` 中配置：

```yaml
ai:
  api-url: https://api.hunyuan.cloud.tencent.com/...
  api-key: YOUR_API_KEY
```

> 本模块为可选功能，未配置密钥时接口会返回提示信息，不影响系统其他功能正常运行。
