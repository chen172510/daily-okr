# 行醒 · 每日复盘与成长工具

个人成长工具 Web App：每日复盘 + OKR 追踪 + 错题本 + 点灯人 + 知识库。小说语录风格，有生活味儿。

## 快速启动

```bash
# 安装依赖
npm install

# 启动服务
npm start
```

打开 http://localhost:3000/pages/login.html 注册账号即可使用。

默认端口 3000，可通过环境变量 `PORT` 修改：
```bash
PORT=8080 npm start
```

## 功能模块

| 模块 | 说明 | 数据持久化 |
|------|------|-----------|
| 每日复盘 | 三省吾身 + 心境记录 | ✅ SQLite |
| OKR 管理 | 目标与关键结果追踪 | ✅ SQLite |
| 错题本 | 记录错题与反思 | ✅ SQLite |
| 点灯人 | AI 对话助手 | 本地 |
| 知识库 | 个人资源收藏 | ✅ SQLite |
| 每日计划 | 当日任务规划 | 本地 |

## 数据同步机制

- 前端使用 localStorage 本地存储 + 服务端云端同步双轨制
- 登录后自动开启后台同步（每 10 秒推送一次待同步数据）
- 页面加载时从云端拉取最新数据并合并到本地
- 离线时数据保留在本地，恢复联网后自动同步

## 数据库

- 使用 sql.js（SQLite 的 WebAssembly 版本）
- 数据库文件：`server/xingxing.db`
- 首次启动自动创建表结构

## 部署到服务器

### 方式一：Node.js 直部署

```bash
# 上传整个项目到服务器
# 在服务器上执行
npm install
npm start
```

建议使用 PM2 守护进程：
```bash
npm install -g pm2
pm2 start server/server.js --name xingxing
pm2 save
```

### 方式二：Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server/server.js"]
```

### 方式三：支持 Node.js 的平台

- **Vercel / Railway / Render / 腾讯云 CloudBase** 等支持 Node.js 的平台
- 启动命令：`npm start`
- 构建命令：`npm install`
- 监听端口由平台环境变量 `PORT` 决定

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3000 | 服务监听端口 |
| `JWT_SECRET` | xingxing-secret-key | JWT 签名密钥（生产环境务必修改） |

## 目录结构

```
daily-okr/
├── package.json          # 根目录 package（部署用）
├── server/               # 后端服务
│   ├── server.js         # 服务入口
│   ├── database.js       # 数据库初始化
│   ├── routes/           # API 路由
│   │   ├── auth.js       # 认证（注册/登录）
│   │   ├── api.js        # 业务数据 API
│   │   └── sync.js       # 数据同步 API
│   ├── middleware/
│   │   └── auth.js       # JWT 鉴权中间件
│   └── xingxing.db       # SQLite 数据库文件
├── pages/                # 前端页面
│   ├── login.html        # 登录/注册
│   ├── dashboard.html    # 首页看板
│   ├── review.html       # 每日复盘
│   ├── okrs.html         # OKR 列表
│   ├── okr-detail.html   # OKR 详情
│   ├── error-book.html   # 错题本
│   ├── light-keeper.html # 点灯人
│   ├── resources.html    # 知识库
│   ├── daily-plan.html   # 每日计划
│   ├── annotate.html     # 批注
│   └── profile.html      # 个人中心
├── assets/               # 前端资源
│   ├── common.js         # 通用工具函数
│   ├── api.js            # API 封装 + 同步机制
│   ├── quotes.js         # 每日语录库
│   ├── page-nav.js       # 页面导航
│   ├── user-module.js    # 用户模块
│   ├── tailwind.min.js   # Tailwind CSS
│   ├── lucide.min.js     # Lucide 图标
│   └── app-icon.png      # App 图标
└── app/                  # 移动端打包（Capacitor）
    ├── www/              # Web 资源（自动同步）
    └── android/          # Android 工程
```

## API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 复盘
- `GET /api/reviews?limit=20&offset=0` - 复盘列表
- `GET /api/reviews/:date` - 单天复盘
- `PUT /api/reviews/:date` - 保存/更新复盘
- `DELETE /api/reviews/:date` - 删除复盘

### OKR
- `GET /api/okrs` - OKR 列表
- `POST /api/okrs` - 创建 OKR
- `PUT /api/okrs/:id` - 更新 OKR
- `DELETE /api/okrs/:id` - 删除 OKR

### 错题本
- `GET /api/error-books` - 错题列表
- `POST /api/error-books` - 添加错题
- `PUT /api/error-books/:id` - 更新错题
- `DELETE /api/error-books/:id` - 删除错题

### 同步
- `GET /api/sync/pull` - 拉取所有数据
- `POST /api/sync/push` - 推送本地数据
- `POST /api/sync/full` - 全量同步

## 移动端打包

项目使用 Capacitor 打包 Android App。

```bash
cd app
npm install
npx cap sync android
npx cap open android
```

在 Android Studio 中 Build APK 即可。

## 常见问题

**Q: 数据库文件在哪？**
A: `server/xingxing.db`，删除后重启服务会重新创建空数据库。

**Q: 如何备份数据？**
A: 直接复制 `server/xingxing.db` 文件即可。也可以通过同步 API 导出 JSON。

**Q: 忘记密码怎么办？**
A: 目前没有找回密码功能，需要在数据库中手动更新或注册新账号。

**Q: 可以多人使用吗？**
A: 支持多用户注册，每个用户的数据互相隔离。
