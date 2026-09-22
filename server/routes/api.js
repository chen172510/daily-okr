/* ============================================
   行醒后端 - 业务数据接口
   提供 REST 风格的各模块接口
   复盘、错题本、知识库、充电记录
   ============================================ */

const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ========== 工具函数 ==========
function getData(userId, key) {
  const row = db.prepare(
    'SELECT data_value, updated_at FROM user_data WHERE user_id = ? AND data_key = ? AND is_deleted = 0'
  ).get(userId, key);
  if (!row) return null;
  try {
    return { value: JSON.parse(row.data_value), updatedAt: row.updated_at };
  } catch (e) {
    return null;
  }
}

function setData(userId, key, value) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO user_data (user_id, data_key, data_value, updated_at, is_deleted)
    VALUES (?, ?, ?, ?, 0)
    ON CONFLICT(user_id, data_key) DO UPDATE SET
      data_value = excluded.data_value,
      updated_at = excluded.updated_at,
      is_deleted = 0
  `).run(userId, key, JSON.stringify(value), now);
  return now;
}

// ========== 复盘 ==========

// 获取复盘列表
router.get('/reviews', authMiddleware, (req, res) => {
  const userId = req.userId;
  const limit = parseInt(req.query.limit) || 30;
  const offset = parseInt(req.query.offset) || 0;

  // 复盘数据按日期存为 xingxing_review_YYYY-MM-DD
  const rows = db.prepare(`
    SELECT data_key, data_value, updated_at
    FROM user_data
    WHERE user_id = ? AND data_key LIKE 'xingxing_review_%' AND is_deleted = 0
    ORDER BY data_key DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset);

  const reviews = rows.map(row => {
    try {
      const data = JSON.parse(row.data_value);
      return {
        date: row.data_key.replace('xingxing_review_', ''),
        ...data,
        updatedAt: row.updated_at
      };
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  res.json({ reviews, total: rows.length });
});

// 获取单天复盘
router.get('/reviews/:date', authMiddleware, (req, res) => {
  const userId = req.userId;
  const date = req.params.date;
  const key = `xingxing_review_${date}`;

  const data = getData(userId, key);
  if (!data) {
    return res.json({ review: null, date });
  }
  res.json({ review: data.value, date, updatedAt: data.updatedAt });
});

// 保存复盘
router.put('/reviews/:date', authMiddleware, (req, res) => {
  const userId = req.userId;
  const date = req.params.date;
  const key = `xingxing_review_${date}`;

  const updatedAt = setData(userId, key, req.body);
  res.json({ success: true, updatedAt });
});

// ========== 错题本 ==========

// 获取错题本
router.get('/mistakes', authMiddleware, (req, res) => {
  const userId = req.userId;
  const data = getData(userId, 'xingxing_mistakes');
  const total = db.prepare('SELECT value FROM user_data WHERE user_id = ? AND data_key = ?')
    .get(userId, 'xingxing_total_errors');

  res.json({
    mistakes: data ? data.value : { categories: [], errorItems: [] },
    totalErrors: total ? parseInt(JSON.parse(total.value), 10) : 0,
    updatedAt: data ? data.updatedAt : null
  });
});

// 保存错题本
router.put('/mistakes', authMiddleware, (req, res) => {
  const userId = req.userId;
  const updatedAt = setData(userId, 'xingxing_mistakes', req.body);

  // 同步更新总数
  if (req.body.errorItems) {
    setData(userId, 'xingxing_total_errors', String(req.body.errorItems.length));
  }

  res.json({ success: true, updatedAt });
});

// 添加单道错题
router.post('/mistakes', authMiddleware, (req, res) => {
  const userId = req.userId;
  const current = getData(userId, 'xingxing_mistakes');
  const mistakes = current ? current.value : { categories: [], errorItems: [] };

  const newError = {
    id: 'e_' + Date.now(),
    ...req.body,
    addedDate: new Date().toISOString().split('T')[0],
    errorCount: 1,
    masteryLevel: 60,
    status: 'normal',
    consecutiveSuccess: 0,
    history: [{ date: new Date().toISOString().split('T')[0], context: req.body.description || '', reflection: '' }]
  };

  mistakes.errorItems.unshift(newError);
  const updatedAt = setData(userId, 'xingxing_mistakes', mistakes);

  // 更新总数
  const totalRow = db.prepare('SELECT data_value FROM user_data WHERE user_id = ? AND data_key = ?')
    .get(userId, 'xingxing_total_errors');
  const total = totalRow ? parseInt(JSON.parse(totalRow.data_value), 10) + 1 : 1;
  setData(userId, 'xingxing_total_errors', String(total));

  res.json({ mistake: newError, updatedAt, totalErrors: total });
});

// ========== 知识库 ==========

router.get('/resources', authMiddleware, (req, res) => {
  const userId = req.userId;
  const data = getData(userId, 'xingxing_resources');
  res.json({
    resources: data ? data.value : { folders: [], items: [] },
    updatedAt: data ? data.updatedAt : null
  });
});

router.put('/resources', authMiddleware, (req, res) => {
  const userId = req.userId;
  const updatedAt = setData(userId, 'xingxing_resources', req.body);
  res.json({ success: true, updatedAt });
});

// ========== 充电记录 ==========

router.get('/charge/records', authMiddleware, (req, res) => {
  const userId = req.userId;
  const limit = parseInt(req.query.limit) || 50;

  const recordsData = getData(userId, 'xingxing_charge_records');
  const todayData = getData(userId, 'xingxing_charge_today');

  res.json({
    records: recordsData ? recordsData.value : [],
    today: todayData ? todayData.value : { count: 0, items: [] },
    updatedAt: recordsData ? recordsData.updatedAt : null
  });
});

router.post('/charge/records', authMiddleware, (req, res) => {
  const userId = req.userId;
  const today = new Date().toISOString().split('T')[0];

  // 追加到历史记录
  const recordsData = getData(userId, 'xingxing_charge_records');
  const records = recordsData ? recordsData.value : [];
  const newRecord = {
    id: 'cr_' + Date.now(),
    ...req.body,
    timestamp: new Date().toISOString()
  };
  records.unshift(newRecord);
  setData(userId, 'xingxing_charge_records', records);

  // 更新今日充电
  const todayData = getData(userId, 'xingxing_charge_today');
  const todayCharge = todayData && todayData.value.date === today
    ? todayData.value
    : { count: 0, items: [], date: today };

  todayCharge.count++;
  todayCharge.items.unshift({
    id: newRecord.id,
    recipeName: req.body.recipeName,
    duration: req.body.duration,
    timestamp: newRecord.timestamp
  });
  const updatedAt = setData(userId, 'xingxing_charge_today', todayCharge);

  res.json({ record: newRecord, updatedAt });
});

// ========== 积分与统计 ==========

router.get('/stats', authMiddleware, (req, res) => {
  const userId = req.userId;

  const keys = [
    'xingxing_points',
    'xingxing_streak',
    'xingxing_total_reviews',
    'xingxing_total_errors',
    'xingxing_charge_today',
    'xingxing_drain_events',
    'xingxing_frog_task'
  ];

  const result = {};
  for (const key of keys) {
    const data = getData(userId, key);
    result[key] = data ? data.value : null;
  }

  res.json({
    points: result['xingxing_points'] ? parseInt(result['xingxing_points'], 10) : 0,
    streak: result['xingxing_streak'] ? parseInt(result['xingxing_streak'], 10) : 0,
    totalReviews: result['xingxing_total_reviews'] ? parseInt(result['xingxing_total_reviews'], 10) : 0,
    totalErrors: result['xingxing_total_errors'] ? parseInt(result['xingxing_total_errors'], 10) : 0,
    todayCharge: result['xingxing_charge_today'] || { count: 0, items: [] },
    drainEvents: result['xingxing_drain_events'] || { events: [] },
    frogTask: result['xingxing_frog_task'] || null
  });
});

// ========== 导出全部数据 ==========

router.get('/export', authMiddleware, (req, res) => {
  const userId = req.userId;

  const rows = db.prepare(`
    SELECT data_key, data_value, updated_at
    FROM user_data
    WHERE user_id = ? AND is_deleted = 0
    ORDER BY data_key
  `).all(userId);

  const data = {};
  rows.forEach(row => {
    try {
      data[row.data_key] = { value: JSON.parse(row.data_value), updatedAt: row.updated_at };
    } catch (e) {}
  });

  const user = db.prepare('SELECT username, email, nickname, created_at FROM users WHERE id = ?').get(userId);

  res.json({
    exportedAt: new Date().toISOString(),
    user: { username: user.username, email: user.email, nickname: user.nickname, createdAt: user.created_at },
    data
  });
});

module.exports = router;
