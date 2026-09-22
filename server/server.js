/* ============================================
   行醒后端 - 主服务入口
   ============================================ */

const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 中间件 ==========
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ========== 静态文件（前端页面） ==========
const publicPath = path.join(__dirname, '..');
app.use(express.static(publicPath, {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

// ========== API 路由 ==========
app.use('/api', authRoutes);
app.use('/api', syncRoutes);
app.use('/api', apiRoutes);

// ========== 健康检查 ==========
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ========== 首页重定向到 dashboard ==========
app.get('/', (req, res) => {
  res.redirect('/pages/dashboard.html');
});

// ========== 错误处理 ==========
app.use((err, req, res, next) => {
  console.error('[服务器错误]', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// ========== 启动（先初始化数据库） ==========
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('========================================');
    console.log('  行醒后端服务已启动');
    console.log('  端口:', PORT);
    console.log('  前端页面: http://localhost:' + PORT + '/pages/dashboard.html');
    console.log('  登录页面: http://localhost:' + PORT + '/pages/login.html');
    console.log('  API 健康检查: http://localhost:' + PORT + '/api/health');
    console.log('========================================');
  });
}).catch(err => {
  console.error('[启动失败]', err);
  process.exit(1);
});
