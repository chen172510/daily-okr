# 行醒（XingXing）· 个人复盘与成长工具

> 一个「有生活味儿」的个人成长 Web 应用：每日复盘 · OKR 追踪 · 错题本 · 点灯人 · 知识库。
> 深色星空主题 + 行星桌宠 + 小说语录，把「复盘」做成一件每天想做的事。

## 这是什么

行醒把「每日复盘、目标管理、错题整理、知识收藏」收进一个安静、有温度的地方。它不是冷冰冰的效率软件，更像每天陪你省身、记道途、写札记的老朋友。

核心场景：

- 每日复盘（省身）：三省吾身 + 心境记录
- OKR 管理（道途）：目标与关键结果跟踪
- 错题本：记录错题与反思
- 点灯人：AI 对话助手（当前为本地演示模式）
- 知识库：个人资源收藏
- 每日计划：当日任务规划

## 主要特性

- 离线优先：前端 localStorage 本地存储 + 待同步队列，断网可用、恢复联网自动合并
- 多用户：注册 / 登录（JWT 认证），用户数据互相隔离
- 双轨同步：每 30 秒后台增量同步（pull / push），冲突保留
- 11 个页面：登录、看板、复盘、OKR、错题本、点灯人、知识库、每日计划、批注、个人中心
- 独特视觉与文案：深色星空主题、行星桌宠、83 条小说语录（雪中悍刀行等）
- 纯 JS 全栈：无需构建步骤，`npm install` + `npm start` 即可运行

## 技术栈

| 层 | 技术 |
|------|------|
| 前端 | 原生 HTML / CSS / JavaScript + Tailwind CSS（CDN）+ Lucide 图标 |
| 后端 | Node.js + Express |
| 数据库 | sql.js（SQLite 的 WebAssembly 版，纯 JS 无需编译） |
| 认证 | JWT（jsonwebtoken + bcryptjs） |

## 快速开始

```bash
npm install
npm start
```

打开 http://localhost:3000/pages/login.html 注册账号即可使用。

- 默认端口 `3000`，可用环境变量 `PORT` 修改
- 生产环境请设置 `JWT_SECRET`

## 项目结构

```
daily-okr/
├── server/               # 后端
│   ├── server.js         # 服务入口（Express + 静态文件）
│   ├── database.js       # sql.js 封装 + 表结构
│   ├── routes/           # auth / api / sync 路由
│   └── middleware/       # JWT 鉴权中间件
├── pages/                # 前端页面（11 个）
├── assets/               # 前端资源（api.js / common.js / quotes.js 等）
├── package.json
└── README.md
```

## 核心设计：离线优先的数据同步

这是本项目最有意思的工程点。前端劫持 `localStorage.setItem / removeItem`，自动追踪以 `xingxing_` 前缀的业务数据：

1. 写入时记录时间戳；已登录则加入待同步队列
2. 每 30 秒后台推送增量变更；页面回到前台立即同步
3. 拉取时按时间戳做冲突裁决（云端更新才覆盖本地）
4. 离线时数据留在本地，恢复联网自动合并

服务端用 `user_data` 表做键值对存储，配合增量 `pull / push / full` 三个同步接口。

## 数据模型

- `users`：用户表（用户名 / 邮箱 / 密码哈希 / 偏好）
- `user_data`：用户业务数据（键值对，支持软删除、时间戳同步）
- `daily_stats`：每日统计（能量 / 状态 / 完成度）

## API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 当前用户 |
| GET | `/api/reviews` | 复盘列表 |
| PUT | `/api/reviews/:date` | 保存 / 更新复盘 |
| GET / POST | `/api/okrs` | OKR 列表 / 创建 |
| GET / POST | `/api/error-books` | 错题列表 / 添加 |
| GET | `/api/sync/pull` | 增量拉取 |
| POST | `/api/sync/push` | 增量推送 |

## 路线图

- [x] 复盘模块前后端打通
- [x] 用户注册 / 登录 / JWT
- [x] 离线同步机制
- [ ] OKR / 错题本 / 知识库接入后端
- [ ] 数据导出 / 导入
- [ ] 统计可视化（复盘热力图、连续打卡）
- [ ] 点灯人接入真实 AI
- [ ] 移动端打包（Capacitor）