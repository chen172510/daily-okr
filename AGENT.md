# 行醒（XingXing）· 接手必读

## 这是什么
个人成长 / 复盘工具。每日复盘 · OKR 追踪 · 错题本 · 点灯人 · 知识库。
深色星空主题 + 行星桌宠。**只有一个用户：刘饮自己。**

## 结构（别搞错）
```
pages/*.html      11 个页面（前端主体，改页面就动这里）
assets/           静态资源；mobile.js = 手机端公共脚本（底部导航 + SW 注册）
server/server.js  后端，端口 3000，SQLite。演示账号 demo / demo123
manifest.json     PWA 清单（已配好，display: standalone）
sw.js             Service Worker（离线用，已配好）
app/              Capacitor 安卓打包工程 —— 除非明确要求，别碰（重、慢、烧钱）
desktop-pet/      桌宠模块（独立，里面有 node_modules）
```

## 开工前必读
- 根目录 `AGENT.md`（本文件）
- 全局约定 `C:\Users\刘家豪\.codex\AGENT.md`
- 需求模糊时走 `idea-to-product` skill：**先整理成文档 → 用户确认 → 才写代码**

## 这个项目的硬规矩
1. **不许自动跑 git** —— `git add/commit/push` 用户自己来。这个仓库 228MB / 9000+ 文件，一次 git 扫描就烧掉几块钱
2. **不许读大文件** —— `node_modules/`（三处，共约 100MB）、`*.mp4`、`*.pptx`、`作品集截图/` 一律不读
3. **改手机端样式只动 `assets/mobile.css` / `mobile.js`**，别挨个改 11 个 HTML
4. **要加公共脚本，挂到 `assets/mobile.js`**（所有页面都引了它），别改 11 个页面
5. 数据存 SQLite（`server/*.db`），改数据结构要同步看 server 里的建表语句

## 怎么跑起来（接手第一件事）
```
双击  启动服务.bat              → 后端 Node，端口 3000
访问  http://localhost:3000/pages/login.html
账号  demo / demo123
演示  login.html?demo=1          → 自动登录（截图/演示用）
手机  双击 phone-url.ps1         → 输出同一 WiFi 下的访问地址
```
**不要直接双击 HTML 文件打开** —— 前端要调后端接口，file:// 协议下接口全挂，表现就是"页面打不开 / 白屏"。

## AI 功能怎么接（重要，别搞混）
AI 走 `server/routes/ai.js`，全部由环境变量驱动，代码不用改：
```
AI_API_KEY      第三方 key（DeepSeek / 智谱 / 通义 / 硅基流动…）
AI_BASE_URL     默认 https://api.deepseek.com
AI_MODEL        默认 deepseek-chat
AI_DAILY_LIMIT  每人每天上限，默认 20
```
- **没配 AI_API_KEY 时自动降级为"本地演示话术"**（503 `AI_NOT_CONFIGURED`），前端照常能用，一分钱不花
- ⚠️ **ChatGPT Plus / Pro 会员 ≠ API key**。会员是订阅，不能给这个项目用。要让项目接 GPT，得去 platform.openai.com 申请 API key（按量另付费）
- 换厂商只改环境变量，别改 ai.js

## 当前状态（2026-09-30 更新）
- 后端可跑，11 个页面全部 200
- PWA manifest + sw.js 已配（https / localhost 下自动注册 SW）
- 手机可局域网访问（IP 随网络变，重跑 phone-url.ps1 查）
- 演示素材 `docs/shots-video/`，成片 `docs/video/行醒-功能演示.mp4`
- 脚本：`_tools/shoot.js`（截图）+ `docs/build_video.py`（合成视频）
- 能量观测站 / 能量补给站 UI 已做在 `pages/dashboard.html` 里，但数据闭环和历史曲线待完善
- 速记助理 `pages/annotate.html` 当前偏「图片批注 + OCR」，需重构成真正的「三秒速记」工具
- 用户明确反馈：**UI 太像 AI 生成，要改成更有手账本/人味儿的设计**

## 下一步任务（按优先级，一次只做一件）
1. **P0：速记助理重构**（`pages/annotate.html`）
   - 首屏改为文字/语音/拍照/截图粘贴输入，3 秒内开始记录
   - 支持标签：#灵感 #待办 #知识点 #情绪 #错题
   - 列表可删除/归档/转存到错题本/知识库/复盘/每日计划
   - 保留现有图片标注和 OCR 作为「更多工具」
2. **P1：UI 去 AI 化**
   - 先去 AI 化：`annotate.html` 作为样板间（不要 emoji、不要大圆角阴影卡片、更像手写速记本）
   - 验证后再推广到其他页面
3. **P2：能量管理闭环**
   - 内外耗事件真实记录并影响精神健康值
   - 充电记录反馈精力/状态，有今日上限
   - 近 7 天精神健康值趋势

详细方案见 `行醒-下一步.md`。

## 移动端现状（2026-09-29）
- ✅ manifest.json 齐全（standalone、图标、竖屏）
- ✅ 11 个页面都有移动端适配（mobile.css / mobile.js）
- ✅ sw.js 已加，https/localhost 下自动注册
- ⚠️ 局域网 http 访问时 SW 不注册（浏览器限制），功能照常用，只是不能离线
- ⚠️ 想真正离线/可安装，需要部署到 **https**

## 省钱
- 默认用便宜模型；只有卡住了才切强力模型
- **一个任务一个会话**，别在一条里无限续
- 一次只做一件事
