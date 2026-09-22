/* ============================================
   行醒 - API 客户端 + 数据同步层
   负责：
   - 统一的 API 请求（带 token、错误处理）
   - 本地数据变更追踪
   - 增量同步（pull/push）
   - 登录态管理
   ============================================ */

(function(global) {
  'use strict';

  // API 地址优先级：运行时覆盖 > App配置 > 默认相对路径
  let runtimeApiBase = null;
  function getApiBase() {
    if (runtimeApiBase) return runtimeApiBase;
    if (global.XingXingAppConfig) {
      return global.XingXingAppConfig.getConfig().apiBase;
    }
    return '/api';
  }

  const TOKEN_KEY = 'xingxing_token';
  const USER_KEY = 'xingxing_user';
  const LAST_SYNC_KEY = 'xingxing_last_sync';
  const PENDING_QUEUE_KEY = 'xingxing_sync_queue';

  // ========== 工具函数 ==========
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
  }

  // ========== API 请求封装 ==========
  async function apiRequest(path, options) {
    options = options || {};
    const headers = options.headers || {};

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const token = getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const config = {
      method: options.method || 'GET',
      headers: headers,
      credentials: 'include'
    };

    if (options.body !== undefined) {
      config.body = headers['Content-Type'] === 'application/json'
        ? JSON.stringify(options.body)
        : options.body;
    }

    try {
      const res = await fetch(getApiBase() + path, config);
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        // token 过期
        logout();
        if (!window.location.pathname.endsWith('login.html')) {
          window.location.href = 'login.html';
        }
        throw new Error(data.error || '登录已过期');
      }

      if (!res.ok) {
        throw new Error(data.error || '请求失败');
      }

      return data;
    } catch (e) {
      if (e.message === 'Failed to fetch' || e.message.includes('NetworkError')) {
        throw new Error('网络连接失败');
      }
      throw e;
    }
  }

  // ========== 同步队列（离线时暂存变更） ==========
  function getPendingQueue() {
    try {
      return JSON.parse(localStorage.getItem(PENDING_QUEUE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function savePendingQueue(queue) {
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
  }

  function addToPendingQueue(key, value) {
    const queue = getPendingQueue();
    queue[key] = {
      value: value,
      updatedAt: new Date().toISOString()
    };
    savePendingQueue(queue);
  }

  function clearPendingQueue() {
    localStorage.removeItem(PENDING_QUEUE_KEY);
  }

  // ========== 数据变更追踪（劫持 localStorage） ==========
  // 包装 localStorage 的 setItem，自动追踪 xingxing_ 前缀的数据变更
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function(key, value) {
    const result = originalSetItem.call(this, key, value);

    // 只追踪业务数据（xingxing_ 开头，排除同步相关和 token）
    if (key.startsWith('xingxing_')
        && !key.endsWith('_updated')
        && key !== TOKEN_KEY
        && key !== USER_KEY
        && key !== LAST_SYNC_KEY
        && key !== PENDING_QUEUE_KEY
        && this === localStorage) {

      // 记录更新时间戳
      originalSetItem.call(this, key + '_updated', new Date().toISOString());

      // 如果已登录，加入待同步队列
      if (isLoggedIn()) {
        try {
          const parsed = JSON.parse(value);
          addToPendingQueue(key, parsed);
        } catch (e) {
          // 非 JSON 数据不加队列
        }
      }
    }

    return result;
  };

  Storage.prototype.removeItem = function(key) {
    const result = originalRemoveItem.call(this, key);

    if (key.startsWith('xingxing_')
        && !key.endsWith('_updated')
        && key !== TOKEN_KEY
        && key !== USER_KEY
        && this === localStorage) {

      originalRemoveItem.call(this, key + '_updated');

      if (isLoggedIn()) {
        const queue = getPendingQueue();
        queue[key] = { value: null, updatedAt: new Date().toISOString(), isDeleted: true };
        savePendingQueue(queue);
      }
    }

    return result;
  };

  // ========== 同步核心 ==========

  // 拉取云端增量数据
  async function syncPull() {
    if (!isLoggedIn()) return { merged: 0 };

    const lastSync = localStorage.getItem(LAST_SYNC_KEY) || '';
    const path = lastSync ? '/sync/pull?since=' + encodeURIComponent(lastSync) : '/sync/pull';

    try {
      const data = await apiRequest(path);
      let merged = 0;

      for (const [key, item] of Object.entries(data.data || {})) {
        const localUpdated = localStorage.getItem(key + '_updated');
        const cloudUpdated = item.updatedAt;

        // 云端更新才覆盖本地
        if (!localUpdated || new Date(cloudUpdated) > new Date(localUpdated)) {
          if (item.isDeleted) {
            localStorage.removeItem(key);
          } else {
            originalSetItem.call(localStorage, key, JSON.stringify(item.value));
            originalSetItem.call(localStorage, key + '_updated', cloudUpdated);
          }
          merged++;
        }
      }

      // 更新最后同步时间
      localStorage.setItem(LAST_SYNC_KEY, data.serverTime);

      return { merged, serverTime: data.serverTime };
    } catch (e) {
      console.warn('[同步] 拉取失败:', e.message);
      throw e;
    }
  }

  // 推送本地待同步队列到云端
  async function syncPush() {
    if (!isLoggedIn()) return { updated: 0 };

    const queue = getPendingQueue();
    const keys = Object.keys(queue);

    if (keys.length === 0) {
      return { updated: 0, skipped: 0 };
    }

    try {
      const result = await apiRequest('/sync/push', {
        method: 'POST',
        body: { data: queue }
      });

      // 清空已推送的队列
      if (result.conflicts && result.conflicts.length > 0) {
        // 有冲突的保留，其余清空
        const newQueue = {};
        result.conflicts.forEach(key => {
          if (queue[key]) newQueue[key] = queue[key];
        });
        savePendingQueue(newQueue);
      } else {
        clearPendingQueue();
      }

      // 更新最后同步时间
      if (result.serverTime) {
        localStorage.setItem(LAST_SYNC_KEY, result.serverTime);
      }

      return result;
    } catch (e) {
      console.warn('[同步] 推送失败:', e.message);
      throw e;
    }
  }

  // 完整同步：先拉再推
  async function syncAll() {
    if (!isLoggedIn()) return { pull: 0, push: 0 };

    try {
      const pullResult = await syncPull();
      const pushResult = await syncPush();
      return {
        pullMerged: pullResult.merged,
        pushUpdated: pushResult.updated,
        pushSkipped: pushResult.skipped,
        serverTime: pullResult.serverTime
      };
    } catch (e) {
      throw e;
    }
  }

  // ========== 后台自动同步 ==========
  let syncTimer = null;
  let syncInterval = 30000; // 30 秒一次

  function startAutoSync(interval) {
    if (interval) syncInterval = interval;
    stopAutoSync();

    syncTimer = setInterval(async () => {
      if (!isLoggedIn()) return;

      const queue = getPendingQueue();
      if (Object.keys(queue).length === 0) {
        // 没有待推送的，只拉取
        try {
          await syncPull();
        } catch (e) {
          // 静默失败
        }
      } else {
        // 有待推送的，全量同步
        try {
          await syncAll();
        } catch (e) {
          // 静默失败
        }
      }
    }, syncInterval);
  }

  function stopAutoSync() {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  }

  // ========== 页面可见性同步（回到页面时立即同步） ==========
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isLoggedIn()) {
      syncAll().catch(() => {});
    }
  });

  // ========== 导出 API ==========
  global.XingXingAPI = {
    // 认证
    isLoggedIn,
    getUser,
    logout,

    // 请求
    request: apiRequest,
    get: (path) => apiRequest(path),
    post: (path, body) => apiRequest(path, { method: 'POST', body }),
    put: (path, body) => apiRequest(path, { method: 'PUT', body }),
    delete: (path) => apiRequest(path, { method: 'DELETE' }),

    // 同步
    syncPull,
    syncPush,
    syncAll,
    startAutoSync,
    stopAutoSync,
    getPendingQueue,
    getLastSyncTime: () => localStorage.getItem(LAST_SYNC_KEY),

    // 常量
    get apiBase() { return getApiBase(); },
    setApiBase: (url) => {
      if (global.XingXingAppConfig) {
        global.XingXingAppConfig.saveConfig({ apiBase: url });
      }
    },
    _apiBase: null // 用于运行时覆盖
  };

  // 页面加载时启动自动同步
  if (isLoggedIn()) {
    startAutoSync();
  }

})(window);
