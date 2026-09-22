/* ============================================
   行醒后端 - 鉴权中间件 + JWT 工具
   ============================================ */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'xingxing-secret-key-change-in-production';
const JWT_EXPIRES_IN = '30d';

function generateToken(userId, username) {
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (e) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

module.exports = { generateToken, authMiddleware, JWT_SECRET };
