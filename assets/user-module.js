/* ============================================
   行醒 - 用户模块（前端）
   - 登录态检测与 UI 更新
   - 用户信息展示
   - 同步状态指示
   - 退出登录
   ============================================ */

(function(global) {
  'use strict';

  // ========== 初始化 ==========
  function init() {
    updateUserUI();
    setupUserClick();
    addSyncIndicator();
  }

  // ========== 更新用户 UI ==========
  function updateUserUI() {
    const user = XingXingAPI.getUser();
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const userMottoEl = document.getElementById('userMotto');

    if (XingXingAPI.isLoggedIn() && user) {
      // 已登录：显示云端用户名
      if (userNameEl) {
        userNameEl.textContent = user.nickname || user.username;
      }
      if (userAvatarEl) {
        userAvatarEl.textContent = (user.nickname || user.username).charAt(0);
      }
      if (userMottoEl) {
        userMottoEl.textContent = '已登录 · 数据同步中';
      }
    } else {
      // 未登录：显示默认 + 提示
      if (userMottoEl) {
        userMottoEl.textContent = '点击登录 · 同步数据';
      }
    }
  }

  // ========== 用户区域点击 ==========
  function setupUserClick() {
    const sidebarUser = document.getElementById('sidebarUser');
    if (!sidebarUser) return;

    // 保存原有的 onclick（openSettings）
    const originalOnclick = sidebarUser.onclick;

    sidebarUser.onclick = function(e) {
      if (XingXingAPI.isLoggedIn()) {
        // 已登录：跳个人中心
        window.location.href = 'profile.html';
      } else {
        // 未登录：跳登录页
        window.location.href = 'login.html';
      }
    };

    // 鼠标悬停提示
    sidebarUser.title = XingXingAPI.isLoggedIn() ? '个人中心' : '点击登录';
  }

  // ========== 添加同步状态指示器 ==========
  function addSyncIndicator() {
    if (!XingXingAPI.isLoggedIn()) return;

    // 在用户区域加一个小的同步状态点
    const userAvatar = document.getElementById('userAvatar');
    if (!userAvatar) return;

    // 创建同步状态圆点
    const syncDot = document.createElement('div');
    syncDot.id = 'syncIndicator';
    syncDot.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #c9a227;
      border: 2px solid #fdfbf5;
      z-index: 2;
    `;
    userAvatar.style.position = 'relative';
    userAvatar.appendChild(syncDot);

    // 更新同步状态
    function updateSyncStatus(status) {
      const dot = document.getElementById('syncIndicator');
      if (!dot) return;
      switch (status) {
        case 'syncing':
          dot.style.background = '#c9a227';
          dot.style.animation = 'pulse 1s infinite';
          break;
        case 'synced':
          dot.style.background = '#2d6a4f';
          dot.style.animation = 'none';
          break;
        case 'error':
          dot.style.background = '#922b21';
          dot.style.animation = 'none';
          break;
        default:
          dot.style.background = '#8a7a5e';
          dot.style.animation = 'none';
      }
    }

    // 监听同步事件
    const origSyncAll = XingXingAPI.syncAll;
    const origSyncPull = XingXingAPI.syncPull;
    const origSyncPush = XingXingAPI.syncPush;

    XingXingAPI.syncAll = async function() {
      updateSyncStatus('syncing');
      try {
        const result = await origSyncAll.apply(this, arguments);
        updateSyncStatus('synced');
        return result;
      } catch (e) {
        updateSyncStatus('error');
        throw e;
      }
    };

    XingXingAPI.syncPull = async function() {
      updateSyncStatus('syncing');
      try {
        const result = await origSyncPull.apply(this, arguments);
        updateSyncStatus('synced');
        return result;
      } catch (e) {
        updateSyncStatus('error');
        throw e;
      }
    };

    // 添加 pulse 动画样式
    if (!document.getElementById('sync-indicator-style')) {
      const style = document.createElement('style');
      style.id = 'sync-indicator-style';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `;
      document.head.appendChild(style);
    }

    // 初始状态
    updateSyncStatus('synced');
  }

  // ========== 登出函数 ==========
  function logout() {
    if (confirm('确定要退出登录吗？本地未同步的数据将保留。')) {
      XingXingAPI.logout();
      XingXingAPI.stopAutoSync();
      window.location.href = 'login.html';
    }
  }

  // ========== 导出 ==========
  global.XingXingUser = {
    init,
    updateUserUI,
    logout
  };

  // 页面加载时自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
