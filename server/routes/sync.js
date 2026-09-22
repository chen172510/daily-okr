/* ============================================
   行醒后端 - 数据同步路由
   基于时间戳的增量同步策略
   GET  /api/sync/pull?since=xxx    拉取云端增量
   POST /api/sync/push               推送本地数据到云端
   ============================================ */

const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ---------- 拉取云端数据（增量） ----------
// 前端传 since（上次同步时间戳），返回所有 updated_at > since 的数据
router.get('/sync/pull', authMiddleware, (req, res) => {
  const since = req.query.since;
  const userId = req.userId;

  let rows;
  if (since) {
    // 增量拉取
    rows = db.prepare(`
      SELECT data_key, data_value, updated_at, is_deleted
      FROM user_data
      WHERE user_id = ? AND updated_at > ?
      ORDER BY updated_at ASC
    `).all(userId, since);
  } else {
    // 全量拉取（第一次同步）
    rows = db.prepare(`
      SELECT data_key, data_value, updated_at, is_deleted
      FROM user_data
      WHERE user_id = ? AND is_deleted = 0
      ORDER BY updated_at ASC
    `).all(userId);
  }

  // 更新用户最后同步时间
  db.prepare('UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId);

  const data = {};
  rows.forEach(row => {
    try {
      data[row.data_key] = {
        value: JSON.parse(row.data_value),
        updatedAt: row.updated_at,
        isDeleted: row.is_deleted === 1
      };
    } catch (e) {
      // 解析失败就跳过
    }
  });

  res.json({
    data,
    serverTime: new Date().toISOString(),
    count: rows.length
  });
});

// ---------- 推送本地数据到云端 ----------
// 前端传 { key: { value, updatedAt } }，后端按时间戳合并
router.post('/sync/push', authMiddleware, (req, res) => {
  const userId = req.userId;
  const clientData = req.body.data || {};

  const upsertStmt = db.prepare(`
    INSERT INTO user_data (user_id, data_key, data_value, updated_at, is_deleted)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, data_key) DO UPDATE SET
      data_value = CASE WHEN excluded.updated_at >= user_data.updated_at THEN excluded.data_value ELSE user_data.data_value END,
      updated_at = CASE WHEN excluded.updated_at >= user_data.updated_at THEN excluded.updated_at ELSE user_data.updated_at END,
      is_deleted = CASE WHEN excluded.updated_at >= user_data.updated_at THEN excluded.is_deleted ELSE user_data.is_deleted END
  `);

  let updated = 0;
  let skipped = 0;
  let conflicts = [];

  const transaction = db.transaction(() => {
    for (const [key, item] of Object.entries(clientData)) {
      if (!key || !item) continue;

      const clientUpdatedAt = item.updatedAt || new Date().toISOString();
      const isDeleted = item.isDeleted ? 1 : 0;
      const value = JSON.stringify(item.value !== undefined ? item.value : item);

      // 检查云端是否有更新的数据
      const existing = db.prepare('SELECT updated_at FROM user_data WHERE user_id = ? AND data_key = ?')
        .get(userId, key);

      if (existing && new Date(existing.updated_at) > new Date(clientUpdatedAt)) {
        // 云端更新，跳过（前端会通过 pull 拿到云端版本）
        skipped++;
        conflicts.push(key);
        continue;
      }

      upsertStmt.run(userId, key, value, clientUpdatedAt, isDeleted);
      updated++;
    }
  });

  transaction();

  // 更新用户最后同步时间
  db.prepare('UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId);

  res.json({
    success: true,
    updated,
    skipped,
    conflicts,
    serverTime: new Date().toISOString()
  });
});

// ---------- 删除单条数据 ----------
router.delete('/sync/item/:key', authMiddleware, (req, res) => {
  const userId = req.userId;
  const key = req.params.key;

  db.prepare(`
    UPDATE user_data SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND data_key = ?
  `).run(userId, key);

  res.json({ success: true });
});

// ---------- 全量同步状态查询 ----------
router.get('/sync/status', authMiddleware, (req, res) => {
  const userId = req.userId;

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_items,
      MAX(updated_at) as last_updated
    FROM user_data
    WHERE user_id = ? AND is_deleted = 0
  `).get(userId);

  const user = db.prepare('SELECT last_sync_at FROM users WHERE id = ?').get(userId);

  res.json({
    totalItems: stats.total_items,
    lastUpdated: stats.last_updated,
    lastSyncAt: user.last_sync_at,
    serverTime: new Date().toISOString()
  });
});

module.exports = router;
