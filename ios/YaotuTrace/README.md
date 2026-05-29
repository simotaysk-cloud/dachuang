# 药途寻迹 iOS 原型

这是把现有 Spring Boot + 微信小程序项目移植到 iOS 的 SwiftUI 版本。当前版本以功能覆盖为主，复用原 Spring Boot 后端接口。

## 已接入能力

- 后端地址配置，默认 `https://cpuzhbc.cn`
- 健康检查：`GET /api/v1/health`
- 账号登录：`POST /api/v1/auth/login`
- 批次列表：`GET /api/v1/batches`
- 扫码或输入批次号查询：`GET /api/v1/trace/{batchNo}`
- AI 同步咨询：`POST /api/v1/ai/chat/sync`
- 顶层双端入口：消费端 / 用户端，可在 iOS 内直接切换
- 消费端：对齐 consumer-miniprogram 的首页、云市集、扫码溯源、智问、我的
- 用户端：对齐 miniprogram-5 的批次工作台、种植、加工、产线作业、质检、物流发运、二维码、终端码、防伪与区块链、监管看板、用户管理、日志汇总
- 通用新增、编辑、删除表单：批次、种植、加工、质检、用户等 CRUD 接口
- 专用操作：发运单创建、二维码图片展示、隐形码生成与验证、上链与验链

## 打开方式

使用 Xcode 打开：

```sh
open ios/YaotuTrace/YaotuTrace.xcodeproj
```

选择 `YaotuTrace` scheme 和任意 iPhone 模拟器即可运行。模拟器不能使用真实摄像头扫码，可以手动输入批次号；真机运行时可使用二维码扫描。

默认后端测试账号：

```text
admin / 123456
farmer / 123456
manufacturer / 123456
logistics / 123456
quality / 123456
```

线上可用溯源批次示例：

```text
MOCK-2024001
```

## 检查重点

- 顶部切换“消费端 / 用户端”，确认两套 Tab 和功能入口相互独立。
- “消费端”查看首页、云市集、溯源入口、智问和我的。
- “用户端”进入首页、批次、生产、核验、账号，检查列表、详情和表单。
- “扫码寻迹”输入 `MOCK-2024001` 检查完整溯源信息。
- “智问”检查 AI 同步问答接口。

## 已知限制

- 当前是原生 SwiftUI 版，功能与页面归属按两个小程序对齐，视觉按 iOS 原生组件重排。
- 上传图片、录音等微信专有交互已保留为 URL 字段；后续可接入 iOS Photos/AVAudioRecorder 上传。
- 真机运行需要在 Xcode 配置 Apple Development Team；模拟器可直接运行。
- 管理类接口需要管理员账号，否则后端会返回 403。
