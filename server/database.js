/* ============================================
   行醒后端 - 数据库（sql.js 版，纯 JS，无需编译）
   封装成类似 better-sqlite3 的 API：db.prepare().run()/get()/all()
   ============================================ */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'xingxing.db');

let db = null;
let SQL = null;

// 持久化到磁盘（每次写入后）
function persist() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('[数据库] 持久化失败:', e.message);
  }
}

// 自动持久化节流（1 秒内最多写一次磁盘）
let persistTimer = null;
let pendingPersist = false;
function schedulePersist() {
  if (persistTimer) {
    pendingPersist = true;
    return;
  }
  persistTimer = setTimeout(() => {
    persist();
    persistTimer = null;
    if (pendingPersist) {
      pendingPersist = false;
      schedulePersist();
    }
  }, 1000);
}

// 封装 Statement 对象
class Statement {
  constructor(sql) {
    this.sql = sql;
  }

  // 执行写操作
  run(...args) {
    const stmt = db.prepare(this.sql);
    stmt.bind(args.flat());
    const result = stmt.step();
    const changes = db.getRowsModified();
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0];
    stmt.free();
    schedulePersist();
    return { changes, lastInsertRowid: lastId };
  }

  // 查询单行
  get(...args) {
    const stmt = db.prepare(this.sql);
    stmt.bind(args.flat());
    const result = stmt.step();
    if (!result) {
      stmt.free();
      return undefined;
    }
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    stmt.free();
    const row = {};
    columns.forEach((col, i) => { row[col] = values[i]; });
    return row;
  }

  // 查询多行
  all(...args) {
    const stmt = db.prepare(this.sql);
    stmt.bind(args.flat());
    const columns = stmt.getColumnNames();
    const rows = [];
    while (stmt.step()) {
      const values = stmt.get();
      const row = {};
      columns.forEach((col, i) => { row[col] = values[i]; });
      rows.push(row);
    }
    stmt.free();
    return rows;
  }
}

// 数据库对象
const dbWrapper = {
  _instance: null,

  prepare(sql) {
    return new Statement(sql);
  },

  exec(sql) {
    db.exec(sql);
    schedulePersist();
  },

  pragma(sql) {
    // sql.js 不支持部分 pragma，忽略
    try { db.exec('PRAGMA ' + sql); } catch (e) {}
  },

  transaction(fn) {
    return function(...args) {
      db.exec('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        db.exec('COMMIT');
        schedulePersist();
        return result;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    };
  },

  // 手动持久化（服务关闭时调用）
  flush() {
    persist();
  }
};

// 初始化
async function initDatabase() {
  SQL = await initSqlJs();

  // 从磁盘加载或新建
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('[数据库] 从磁盘加载:', dbPath);
  } else {
    db = new SQL.Database();
    console.log('[数据库] 新建数据库:', dbPath);
  }

  dbWrapper._instance = db;

  // ========== 用户表 ==========
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      nickname VARCHAR(50),
      avatar TEXT,
      energy_type VARCHAR(20) DEFAULT 'steady',
      sleep_quality VARCHAR(20) DEFAULT 'good',
      theme VARCHAR(20) DEFAULT 'day',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_sync_at DATETIME
    )
  `);

  // ========== 用户数据表（键值对同步模型） ==========
  db.run(`
    CREATE TABLE IF NOT EXISTS user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      data_key VARCHAR(100) NOT NULL,
      data_value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      UNIQUE(user_id, data_key)
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_user_data_updated ON user_data(user_id, updated_at)');

  // ========== 每日统计表 ==========
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      energy_avg INTEGER,
      state_avg INTEGER,
      mental_avg INTEGER,
      physical_avg INTEGER,
      points_earned INTEGER DEFAULT 0,
      review_done INTEGER DEFAULT 0,
      frog_done INTEGER DEFAULT 0,
      charge_count INTEGER DEFAULT 0,
      external_drain INTEGER DEFAULT 0,
      internal_drain INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `);

  schedulePersist();
  console.log('[数据库] 初始化完成');

  return dbWrapper;
}

// 进程退出时刷盘
process.on('exit', () => {
  if (db) persist();
});
process.on('SIGINT', () => {
  if (db) persist();
  process.exit(0);
});

module.exports = dbWrapper;
module.exports.initDatabase = initDatabase;
