# miniprogram-5 — 管理端小程序

"药途寻迹"中药材溯源系统**管理端微信小程序**，面向企业内部多角色用户，实现从种植到物流的全链路数据录入与管理。

## 项目信息

- **微信 AppID**：`wxb6004f50990df687`
- **源码目录**：`src/`
- **编译输出**：`dist/`（由 Gulp 构建生成，不提交到 Git）

## 目录结构

```
miniprogram-5/
├── src/
│   ├── pages/                  # 页面目录
│   │   ├── index/              # 首页 / 工作台
│   │   ├── login/              # 登录页
│   │   ├── batch/              # 批次列表
│   │   ├── batch-form/         # 批次创建/编辑表单
│   │   ├── planting/           # 种植记录列表
│   │   ├── planting-form/      # 种植记录录入
│   │   ├── planting-dashboard/ # 种植数据看板
│   │   ├── processing/         # 加工记录列表
│   │   ├── processing-form/    # 加工记录录入
│   │   ├── line-work/          # 产线作业管理
│   │   ├── inspection/         # 质量检验列表
│   │   ├── inspection-form/    # 检验单录入
│   │   ├── logistics/          # 物流列表
│   │   ├── shipment-form/      # 发货单录入
│   │   ├── qrcode/             # 溯源码生成/查看
│   │   ├── terminal-qrcode/    # 终端扫码页
│   │   ├── security/           # 区块链存证 & 防伪查询
│   │   ├── user-mgmt/          # 用户管理
│   │   ├── web-dashboard/      # Web 嵌入式数据看板
│   │   ├── logs/               # 操作日志
│   │   └── mine/               # 个人中心
│   ├── components/             # 公共组件（user-info 等）
│   ├── utils/
│   │   ├── config.js           # API 基础地址配置
│   │   ├── api.js              # HTTP 请求封装
│   │   └── rbac.js             # 基于角色的权限控制工具
│   └── assets/                 # 图片等静态资源
├── components/
│   └── supply-chain-steps/     # 供应链步骤可视化组件
├── package.json                # npm 依赖配置
├── tailwind.config.js          # Tailwind CSS 配置
├── postcss.config.js           # PostCSS 配置
└── gulpfile.js                 # Gulp 构建脚本
```

## 角色权限说明

系统支持以下角色，各角色可见页面由 `utils/rbac.js` 控制：

| 角色 | 主要权限 |
|------|----------|
| admin（管理员） | 全部功能 + 用户管理 |
| farmer（种植户） | 种植记录录入与查看 |
| factory（工厂） | 加工记录、产线管理 |
| logistics（物流） | 发货单录入、物流跟踪 |
| inspector（检验员） | 质量检验单录入与查看 |
| regulator（监管人员） | 只读查看全链路数据 |

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 构建（监听模式，文件变更自动重新编译）
npm run dev
# 或
npx gulp watch

# 3. 生产构建
npm run build
```

构建完成后，使用微信开发者工具打开 `dist/` 目录，配置 AppID 后即可预览调试。

## 配置说明

修改 `src/utils/config.js` 中的 `BASE_URL` 以指向后端 API：

```js
// 示例
const BASE_URL = 'https://your-server.com:8091';
```

本地开发时后端默认运行在 `http://localhost:8091`，需在微信开发者工具中开启"不校验合法域名"。
