/* 行醒 · Service Worker（自毁版）

   为什么是"自毁"：
   之前用 SW 做离线缓存，结果它把旧脚本缓存住了，导致改完代码刷新也看不到新版本。
   最麻烦的是：修复代码写在新脚本里，而新脚本又被旧缓存挡着 → 死锁。

   现在这个版本一被浏览器装上，就立刻：
     1) 删掉全部缓存
     2) 注销自己（unregister）
     3) 完全不再拦截任何请求
   装完这一次，浏览器就再没有 Service Worker 了，以后刷新拿到的永远是服务器上的最新文件。
   ============================================ */

self.addEventListener('install', function (e) {
  // 立刻接管，不等旧页面关闭
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    Promise.all([
      // 1) 清掉所有缓存
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      }).catch(function () {}),
      // 2) 接管当前页面，保证这次刷新就生效
      self.clients.claim().catch(function () {})
    ]).then(function () {
      // 3) 注销自己，从此不再有 Service Worker
      return self.registration.unregister();
    }).catch(function () {})
  );
});

/* 不拦截任何请求：全部交给浏览器和服务器（服务器已设置 no-cache 校验）。 */
