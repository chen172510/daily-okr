/* ============================================
   行醒后端 - 用户认证路由
   POST /api/auth/register  注册
   POST /api/auth/login     登录
   GET  /api/user/profile   获取个人信息
   PUT  /api/user/profile   更新个人信息
   ============================================ */

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ---------- 注册 ----------
router.post('/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度 2-20 位' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' });
  }

  // 检查用户名是否存在
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已被占用' });
  }

  // 邮箱可选，但如果填了要检查
  if (email) {
    const emailExisting = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (emailExisting) {
      return res.status(400).json({ error: '邮箱已被注册' });
    }
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const nickname = username;

  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, nickname)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(username, email || null, passwordHash, nickname);

  const userId = result.lastInsertRowid;
  const token = generateToken(userId, username);

  // 更新最后同步时间
  db.prepare('UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId);

  res.json({
    token,
    user: {
      id: userId,
      username,
      nickname,
      email: email || null,
      avatar: null,
      energyType: 'steady',
      sleepQuality: 'good',
      theme: 'day'
    }
  });
});

// ---------- 登录 ----------
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(user.id, user.username);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      energyType: user.energy_type,
      sleepQuality: user.sleep_quality,
      theme: user.theme
    }
  });
});

// ---------- 获取个人信息 ----------
router.get('/user/profile', authMiddleware, (req, res) => {
  const user = db.prepare(`
    SELECT id, username, email, nickname, avatar, energy_type, sleep_quality, theme, created_at, last_sync_at
    FROM users WHERE id = ?
  `).get(req.userId);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    avatar: user.avatar,
    energyType: user.energy_type,
    sleepQuality: user.sleep_quality,
    theme: user.theme,
    createdAt: user.created_at,
    lastSyncAt: user.last_sync_at
  });
});

// ---------- 更新个人信息 ----------
router.put('/user/profile', authMiddleware, (req, res) => {
  const { nickname, avatar, energyType, sleepQuality, theme } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const stmt = db.prepare(`
    UPDATE users SET
      nickname = COALESCE(?, nickname),
      avatar = COALESCE(?, avatar),
      energy_type = COALESCE(?, energy_type),
      sleep_quality = COALESCE(?, sleep_quality),
      theme = COALESCE(?, theme),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(
    nickname || null,
    avatar || null,
    energyType || null,
    sleepQuality || null,
    theme || null,
    req.userId
  );

  const updated = db.prepare(`
    SELECT id, username, email, nickname, avatar, energy_type, sleep_quality, theme
    FROM users WHERE id = ?
  `).get(req.userId);

  res.json({
    id: updated.id,
    username: updated.username,
    nickname: updated.nickname,
    email: updated.email,
    avatar: updated.avatar,
    energyType: updated.energy_type,
    sleepQuality: updated.sleep_quality,
    theme: updated.theme
  });
});

// ---------- 修改密码 ----------
router.put('/user/password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少 6 位' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const valid = bcrypt.compareSync(oldPassword, user.password_hash);
  if (!valid) {
    return res.status(400).json({ error: '原密码错误' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newHash, req.userId);

  res.json({ success: true });
});

module.exports = router;
