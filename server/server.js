/* ============================================
   行醒后端 - 主服务入口
   ============================================ */

const express = require('express');
const cors = require('cors');
const path = require('path');
const zlib = require('zlib');

const { initDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const apiRoutes = require('./routes/api');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 中间件 ==========
// 默认同源部署，禁用跨域；如移动端等需要跨域，通过 CORS_ORIGIN 指定允许的来源（逗号分隔）
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : false,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ========== 静态文件（前端页面） ==========
// 开启 gzip：文本类资源（HTML/CSS/JS/JSON/SVG）压缩后再发，页面加载快很多
app.use((req, res, next) => {
  if (!/\bgzip\b/i.test(req.headers['accept-encoding'] || '')) return next();
  const origEnd = res.end;
  const chunks = [];
  res.write = function (chunk, enc) {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, enc || 'utf8'));
    return true;
  };
  res.end = function (chunk, enc) {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, enc || 'utf8'));
    const body = Buffer.concat(chunks);
    if (res.statusCode === 304 || res.statusCode === 204 || body.length === 0) {
      return origEnd.call(res, body);
    }
    const type = String(res.getHeader('Content-Type') || '');
    const compressible = /^(text\/|application\/(javascript|json|xml)|image\/svg)/.test(type);
    if (!res.getHeader('Content-Encoding') && compressible && body.length > 1024) {
      try {
        const gz = zlib.gzipSync(body, { level: 6 });
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('Content-Length', gz.length);
        return origEnd.call(res, gz);
      } catch (e) { /* 压缩失败就原样发 */ }
    }
    if (!res.getHeader('Content-Length')) res.setHeader('Content-Length', body.length);
    return origEnd.call(res, body);
  };
  next();
});

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
app.use('/api', aiRoutes);

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
