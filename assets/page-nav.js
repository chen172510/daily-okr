// 页面切换优化 + 侧边栏滚动条修复 + 通用 UI 补丁
(function() {
  // 立即显示入场遮罩（在页面渲染前就盖住，避免闪烁）
  function showEntryMask() {
    if (document.getElementById('entryMask')) return;
    var mask = document.createElement('div');
    mask.id = 'entryMask';
    mask.style.cssText = [
      'position:fixed;',
      'top:0;left:0;right:0;bottom:0;',
      'background:#f7f2e8;',
      'z-index:10000;',
      'opacity:1;',
      'visibility:visible;',
      'transition:opacity 0.3s ease, visibility 0.3s ease;'
    ].join('');
    document.documentElement.appendChild(mask);
  }
  
  // 页面完全就绪后隐藏入场遮罩
  function hideEntryMask() {
    var mask = document.getElementById('entryMask');
    if (!mask) return;
    // 稍微延迟一下，确保首屏渲染完成
    setTimeout(function() {
      mask.style.opacity = '0';
      mask.style.visibility = 'hidden';
      setTimeout(function() {
        if (mask.parentNode) mask.parentNode.removeChild(mask);
      }, 350);
    }, 50);
  }
  
  // 立即创建入场遮罩（越早越好，防止页面闪烁）
  showEntryMask();
  
  // DOM ready 后隐藏遮罩
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideEntryMask);
  } else {
    hideEntryMask();
  }
  
  // 兜底：load 事件后确保隐藏
  window.addEventListener('load', function() {
    var mask = document.getElementById('entryMask');
    if (mask && mask.style.opacity !== '0') {
      hideEntryMask();
    }
  });
  
  // 注入全局补丁样式（侧边栏滚动条等）
  function injectPatchStyles() {
    if (document.getElementById('uxPatchStyle')) return;
    var style = document.createElement('style');
    style.id = 'uxPatchStyle';
    style.textContent = [
      /* 侧边栏导航可滚动 */
      '.sidebar-nav {',
      '  overflow-y: auto !important;',
      '  overflow-x: hidden !important;',
      '  -webkit-overflow-scrolling: touch;',
      '  scrollbar-width: thin;',
      '}',
      '.sidebar-nav::-webkit-scrollbar {',
      '  width: 4px;',
      '}',
      '.sidebar-nav::-webkit-scrollbar-track {',
      '  background: transparent;',
      '}',
      '.sidebar-nav::-webkit-scrollbar-thumb {',
      '  background: rgba(31, 26, 16, 0.2);',
      '  border-radius: 2px;',
      '}',
      '.sidebar-nav::-webkit-scrollbar-thumb:hover {',
      '  background: rgba(31, 26, 16, 0.35);',
      '}',
      /* 页面切换加载遮罩 */
      '.page-loader {',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  background: rgba(247, 242, 232, 0.92);',
      '  z-index: 9999;',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  justify-content: center;',
      '  gap: 16px;',
      '  opacity: 0;',
      '  visibility: hidden;',
      '  transition: opacity 0.2s ease, visibility 0.2s ease;',
      '  backdrop-filter: blur(4px);',
      '}',
      '.page-loader.active {',
      '  opacity: 1;',
      '  visibility: visible;',
      '}',
      '.page-loader-spinner {',
      '  width: 36px;',
      '  height: 36px;',
      '  border: 3px solid rgba(201, 162, 39, 0.2);',
      '  border-top-color: #c9a227;',
      '  border-radius: 50%;',
      '  animation: page-loader-spin 0.8s linear infinite;',
      '}',
      '@keyframes page-loader-spin {',
      '  to { transform: rotate(360deg); }',
      '}',
      '.page-loader-text {',
      '  font-family: "STKaiti", "KaiTi", "楷体", serif;',
      '  font-size: 14px;',
      '  color: #a8851a;',
      '  letter-spacing: 0.15em;',
      '}',
      /* 导航项点击即时反馈 */
      '.nav-item {',
      '  transition: transform 0.1s ease;',
      '}',
      '.nav-item:active {',
      '  transform: scale(0.97);',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }
  
  // 创建页面切换遮罩（点击导航时显示）
  function createPageLoader() {
    if (document.getElementById('pageLoader')) return;
    injectPatchStyles();
    var loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="page-loader-spinner"></div><div class="page-loader-text">加载中...</div>';
    document.body.appendChild(loader);
  }
  
  function showLoader() {
    createPageLoader();
    var loader = document.getElementById('pageLoader');
    if (loader) {
      loader.classList.add('active');
    }
  }
  
  // 绑定所有站内导航链接
  function bindNavLinks() {
    injectPatchStyles();
    var navItems = document.querySelectorAll('.nav-item[href]');
    navItems.forEach(function(item) {
      var href = item.getAttribute('href');
      // 只处理站内 html 页面跳转，不处理 # 锚点和外链
      if (href && href.endsWith('.html') && !href.startsWith('http') && !item.hasAttribute('data-nav-bound')) {
        item.setAttribute('data-nav-bound', '1');
        item.addEventListener('click', function(e) {
          // 显示加载遮罩
          showLoader();
        });
      }
    });
  }
  
  // 页面加载完成后绑定
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindNavLinks);
  } else {
    bindNavLinks();
  }
  
  // 页面完全加载后隐藏可能残留的 loader
  window.addEventListener('load', function() {
    var loader = document.getElementById('pageLoader');
    if (loader && loader.classList.contains('active')) {
      setTimeout(function() {
        loader.classList.remove('active');
      }, 300);
    }
  });
  
  // 从 bfcache 回来时也确保隐藏
  window.addEventListener('pageshow', function() {
    var loader = document.getElementById('pageLoader');
    if (loader) loader.classList.remove('active');
    var mask = document.getElementById('entryMask');
    if (mask) {
      mask.style.opacity = '0';
      mask.style.visibility = 'hidden';
    }
  });
})();
