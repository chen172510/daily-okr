/* 高清手机可能把 CSS 视口报告为 1200px 左右，所以要同时识别触屏竖屏。 */
window.xxIsMobileView = window.xxIsMobileView || function () {
  try {
    if (window.matchMedia('(max-width: 900px)').matches) return true;
    if (window.matchMedia('(orientation: portrait) and (max-width: 1500px)').matches) return true;
    if (navigator.maxTouchPoints > 0 && window.matchMedia('(orientation: portrait)').matches) {
      var shortSide = Math.min(screen.width || 9999, screen.height || 9999);
      if (shortSide <= 1500) return true;
    }
    return navigator.maxTouchPoints > 0 && Math.min(window.innerWidth, window.innerHeight) <= 900;
  } catch (e) {
    return window.innerWidth <= 900;
  }
};

/* 高清手机若被浏览器按 1200px 桌面视口打开，页面内联的 768px 手机断点会失效。
   这里只在内存中提升这些断点，不修改源文件、不刷新页面。 */
(function () {
  'use strict';
  try {
    if (!window.xxIsMobileView()) return;
    if (window.innerWidth <= 900 && window.matchMedia('(max-width: 900px)').matches) return;
    var portraitQuery = '@media (orientation: portrait) and (max-width: 1500px)';
    Array.prototype.forEach.call(document.querySelectorAll('style'), function (style) {
      var css = style.textContent || '';
      if (!css) return;
      var next = css
        .replace(/@media\s*\(max-width:\s*768px\)/g, portraitQuery)
        .replace(/@media\s*\(max-width:\s*900px\)/g, portraitQuery);
      if (next !== css) style.textContent = next;
    });
    var forceZoom = Math.min(4, Math.max(1, window.innerWidth / 390));
    document.documentElement.style.setProperty('--xx-force-zoom', forceZoom.toFixed(3));
    document.documentElement.classList.add('xx-force-mobile');
    function resetHorizontalPosition() {
      try { window.scrollTo(0, window.scrollY || 0); } catch (e) {}
      document.documentElement.scrollLeft = 0;
      if (document.body) document.body.scrollLeft = 0;
    }
    resetHorizontalPosition();
    window.addEventListener('pageshow', resetHorizontalPosition);
    window.addEventListener('scroll', function () {
      if (window.scrollX !== 0) resetHorizontalPosition();
    }, { passive: true });
    window.addEventListener('orientationchange', function () {
      setTimeout(resetHorizontalPosition, 120);
    });
  } catch (e) {}
})();

/* 手机页面禁止双指缩放和横向橡皮筋；行星图保留双指聚合。 */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;
  try { document.documentElement.style.overscrollBehaviorX = 'none'; } catch (e) {}
  document.addEventListener('touchmove', function (event) {
    if (event.touches.length <= 1) return;
    if (event.target && event.target.closest && event.target.closest('.graph-container')) return;
    event.preventDefault();
  }, { passive: false });
})();

/* 手机系统返回键：专属页打开时先收专属页，不要直接退出当前主页。 */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;

  var pushed = false;
  var suppressCloseBack = false;

  function topLayer() {
    if (document.querySelector('#chargeRecordOverlay.active')) return 'charge-record';
    if (document.querySelector('#chargeMethodOverlay.active')) return 'charge-methods';
    if (document.querySelector('#chargeMethodEditorOverlay.active')) return 'charge-editor';
    if (document.querySelector('#addErrorModal.active')) return 'add-error';
    if (document.body.classList.contains('xx-sheet-open')) return 'sheet';
    return '';
  }

  function closeTopLayer() {
    var layer = topLayer();
    if (layer === 'sheet') {
      var back = document.querySelector('.xx-sheet-back');
      if (back) back.click();
      else document.body.classList.remove('xx-sheet-open');
    } else if (layer === 'charge-record' && window.closeChargeRecordModal) {
      window.closeChargeRecordModal();
    } else if (layer === 'charge-methods' && window.closeChargeMethodManager) {
      window.closeChargeMethodManager();
    } else if (layer === 'charge-editor' && window.closeChargeMethodEditor) {
      window.closeChargeMethodEditor();
    } else if (layer === 'add-error') {
      var close = document.querySelector('#addErrorModal .modal-close');
      if (close) close.click();
    }
  }

  new MutationObserver(function () {
    var open = !!topLayer();
    if (open && !pushed) {
      pushed = true;
      history.pushState({ xxMobileSheet: true }, '');
    } else if (!open && pushed) {
      pushed = false;
      if (!suppressCloseBack) {
        suppressCloseBack = true;
        history.back();
        setTimeout(function () { suppressCloseBack = false; }, 0);
      }
    }
  }).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['class'] });

  window.addEventListener('popstate', function () {
    if (topLayer()) {
      suppressCloseBack = true;
      closeTopLayer();
      pushed = false;
      setTimeout(function () { suppressCloseBack = false; }, 0);
    }
  });
})();

/* 手机端底部导航：除了自带 tabbar 的页面，其余页面自动补一条 */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;
  if (document.querySelector('.xx-mobile-nav')) return;
  if (document.querySelector('.mobile-tabbar')) return;   // 首页已有自己的底部栏

  var ITEMS = [
    ['dashboard.html', '⌂', '行醒'],
    ['okrs.html', '◎', '目标'],
    ['review.html', '✎', '复盘'],      // 中间 C 位：最重要的复盘
    ['error-book.html', '☰', '练习本'],
    ['daily-plan.html', '☑', '每日计划']
  ];
  var MORE = [
    ['annotate.html', '📷', '速记助理'],
    ['resources.html', '📚', '知识库'],
    ['profile.html', '⚙', '个人设置']
  ];

  function build() {
    var here = location.pathname.split('/').pop() || 'dashboard.html';
    var nav = document.createElement('nav');
    nav.className = 'xx-mobile-nav';
    nav.innerHTML = ITEMS.map(function (it) {
      var on = it[0] === here ? ' class="on"' : '';
      var mid = it[0] === 'review.html' ? ' class="xx-nav-center' + (here === 'review.html' ? ' on' : '') + '"' : on;
      return '<a href="' + it[0] + '"' + mid + '><i>' + it[1] + '</i>' + it[2] + '</a>';
    }).join('');
    document.body.appendChild(nav);

    buildMinePanel();
  }

  // 「我的」面板：点右上角头像弹出（原来「更多」里的入口挪到这里）
  function buildMinePanel() {
    if (document.getElementById('xxMinePanel')) return;
    var panel = document.createElement('div');
    panel.className = 'xx-more-panel';
    panel.id = 'xxMinePanel';
    panel.innerHTML = '<div class="xx-more-title">我的 · v6</div>'
      + '<div class="xx-more-grid">' + MORE.map(function (m) {
          return '<a href="' + m[0] + '"><i>' + m[1] + '</i>' + m[2] + '</a>';
        }).join('') + '</div>'
      + '<button class="xx-more-close" type="button">收起</button>';
    document.body.appendChild(panel);
    panel.querySelector('.xx-more-close').addEventListener('click', function () {
      panel.classList.remove('on');
    });
    document.addEventListener('click', function (e) {
      if (!panel.classList.contains('on')) return;
      if (panel.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.xx-avatar-btn')) return;
      panel.classList.remove('on');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

/* 手机端统一返回：优先回到上一个站内页面，否则回首页。 */
(function () {
  'use strict';
  if (window.xxMobileBack) return;
  window.xxMobileBack = function (fallback) {
    try {
      var ref = document.referrer || '';
      var sameApp = ref && (ref.indexOf(location.origin) === 0 || ref.indexOf('file:///') === 0);
      if (sameApp && history.length > 1) {
        history.back();
        return;
      }
    } catch (e) {}
    location.href = fallback || 'dashboard.html';
  };
})();

/* ============================================
   速记助理 · 手机版专属首页
   只重排手机端呈现，沿用页面已有的拍照、语音、速记数据与保存逻辑。
   ============================================ */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;
  if ((location.pathname.split('/').pop() || '').toLowerCase() !== 'annotate.html') return;
  if (document.getElementById('xxQuickNoteHome')) return;

  var NOTE_KEY = 'xx_notes_v1';
  var TYPE_META = {
    clip:  { label: '图片', tone: 'violet', icon: 'image' },
    voice: { label: '语音', tone: 'sage',   icon: 'mic' },
    text:  { label: '文本', tone: 'sand',   icon: 'pen-line' },
    idea:  { label: '灵感', tone: 'sand',   icon: 'sparkles' },
    task:  { label: '待办', tone: 'sage',   icon: 'check-square' }
  };
  var showAll = false;

  function pad(n) { return String(n).padStart(2, '0'); }

  function dateLabel() {
    var d = new Date();
    var week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + week;
  }

  function timeLabel(ts) {
    var d = new Date(ts);
    var now = new Date();
    var hh = pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (d.toDateString() === now.toDateString()) return hh;
    var y = new Date(now);
    y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return '昨天 ' + hh;
    return (d.getMonth() + 1) + '日 ' + hh;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readNotes() {
    try {
      var list = JSON.parse(localStorage.getItem(NOTE_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeNotes(list) {
    try { localStorage.setItem(NOTE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function iconSvg(name) {
    var paths = {
      image: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="8.5" cy="9" r="1.5"></circle><path d="m21 15-5-5L5 20"></path>',
      mic: '<rect x="9" y="2" width="6" height="11" rx="3"></rect><path d="M5 10a7 7 0 0 0 14 0"></path><path d="M12 17v5"></path>',
      'pen-line': '<path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>',
      'chevron-left': '<path d="m15 18-6-6 6-6"></path>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + (paths[name] || paths['pen-line']) + '</svg>';
  }

  function noteIcon(type) {
    return iconSvg((TYPE_META[type] || TYPE_META.text).icon);
  }

  function renderList() {
    var listEl = document.getElementById('xxQuickNoteList');
    var countEl = document.getElementById('xxQuickNoteCount');
    if (!listEl || !countEl) return;

    var notes = readNotes();
    countEl.textContent = showAll ? '收起' : (notes.length ? '查看全部' : '0 条');
    var visible = showAll ? notes : notes.slice(0, 4);

    if (!visible.length) {
      listEl.innerHTML = '<div class="xx-qn-empty">还没有速记。拍一张、说一句，或直接从下面写起。</div>';
      return;
    }

    listEl.innerHTML = visible.map(function (note) {
      var meta = TYPE_META[note.type] || TYPE_META.text;
      var img = note.img
        ? '<img class="xx-qn-thumb" src="' + note.img + '" alt="速记图片" />'
        : '';
      return '<article class="xx-qn-note tone-' + meta.tone + '">'
        + '<div class="xx-qn-note-head">'
        +   '<span class="xx-qn-note-type">' + meta.label + '</span>'
        +   '<time>' + timeLabel(note.time) + '</time>'
        + '</div>'
        + '<p>' + escapeHtml(note.text || '（图片速记）') + '</p>'
        + img
        + '<button class="xx-qn-delete" type="button" data-note-id="' + note.id + '" aria-label="删除这条速记">×</button>'
        + '</article>';
    }).join('');
  }

  function syncOriginalList() {
    var original = document.getElementById('noteList');
    if (!original) return;
    renderList();
  }

  var root = document.createElement('section');
  root.className = 'xx-qn-home';
  root.id = 'xxQuickNoteHome';
  root.innerHTML =
      '<div class="xx-qn-head">'
    +   '<button class="xx-qn-back" type="button" aria-label="返回上一页">' + iconSvg('chevron-left') + '</button>'
    +   '<div class="xx-qn-title">'
    +     '<h1>速记助理</h1>'
    +     '<p>先把想法留下来，之后再去整理。</p>'
    +   '</div>'
    +   '<span class="xx-qn-date">' + dateLabel() + '</span>'
    + '</div>'
    + '<div class="xx-qn-actions">'
    +   '<button class="xx-qn-action tone-violet" type="button" data-qn-action="photo">'
    +     '<span class="xx-qn-icon">' + iconSvg('image') + '</span>'
    +     '<b>拍照识图</b><small>OCR 一键转文字</small>'
    +   '</button>'
    +   '<button class="xx-qn-action tone-sage" type="button" data-qn-action="voice">'
    +     '<span class="xx-qn-icon">' + iconSvg('mic') + '</span>'
    +     '<b>语音速记</b><small>按住即录</small>'
    +   '</button>'
    +   '<button class="xx-qn-action tone-sand" type="button" data-qn-action="text">'
    +     '<span class="xx-qn-icon">' + iconSvg('pen-line') + '</span>'
    +     '<b>文本便签</b><small>三秒开写</small>'
    +   '</button>'
    + '</div>'
    + '<div class="xx-qn-section-head">'
    +   '<h2>最近速记</h2>'
    +   '<button type="button" id="xxQuickNoteCount">查看全部</button>'
    + '</div>'
    + '<div class="xx-qn-list" id="xxQuickNoteList"></div>'
    + '<form class="xx-qn-compose" id="xxQuickNoteCompose">'
    +   '<input type="text" id="xxQuickNoteInput" placeholder="想到什么，直接写…" autocomplete="off" />'
    +   '<button type="submit" aria-label="保存速记">' + iconSvg('pen-line') + '</button>'
    + '</form>';

  document.body.appendChild(root);
  document.body.classList.add('xx-quicknote-mode');
  renderList();

  root.addEventListener('click', function (event) {
    var back = event.target.closest ? event.target.closest('.xx-qn-back') : null;
    if (back) {
      window.xxMobileBack('dashboard.html');
      return;
    }

    var action = event.target.closest ? event.target.closest('[data-qn-action]') : null;
    if (action) {
      var type = action.getAttribute('data-qn-action');
      if (type === 'photo') {
        var photo = document.getElementById('btnPhoto');
        if (photo) photo.click();
      } else if (type === 'voice') {
        var voice = document.getElementById('btnVoice');
        if (voice) voice.click();
      } else {
        var input = document.getElementById('xxQuickNoteInput');
        if (input) input.focus();
      }
      return;
    }

    var del = event.target.closest ? event.target.closest('[data-note-id]') : null;
    if (del) {
      var id = String(del.getAttribute('data-note-id'));
      var remaining = readNotes().filter(function (note) { return String(note.id) !== id; });
      writeNotes(remaining);
      renderList();
    }
  });

  document.getElementById('xxQuickNoteCount').addEventListener('click', function () {
    showAll = !showAll;
    renderList();
  });

  document.getElementById('xxQuickNoteCompose').addEventListener('submit', function (event) {
    event.preventDefault();
    var input = document.getElementById('xxQuickNoteInput');
    var value = (input.value || '').trim();
    if (!value) return;

    var originalInput = document.getElementById('qiText');
    var originalForm = document.getElementById('quickInput');
    if (originalInput && originalForm) {
      originalInput.value = value;
      originalForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    } else {
      var notes = readNotes();
      notes.unshift({ id: Date.now(), type: 'text', text: value, img: '', time: Date.now() });
      writeNotes(notes.slice(0, 200));
    }

    input.value = '';
    setTimeout(renderList, 30);
    if (window.XingxingCommon && XingxingCommon.showToast) {
      XingxingCommon.showToast('已记下', 'success', 1200);
    }
  });

  var originalList = document.getElementById('noteList');
  if (originalList && window.MutationObserver) {
    new MutationObserver(syncOriginalList).observe(originalList, { childList: true, subtree: true });
  }
  ['ocrSave', 'voiceSave', 'btnClear'].forEach(function (id) {
    var button = document.getElementById(id);
    if (button) button.addEventListener('click', function () { setTimeout(renderList, 50); });
  });
})();

/* 关掉 Service Worker（用户要求）：
   它会把旧脚本缓存住，导致"改了看不到"。这里主动注销已注册的 SW 并清空缓存，
   以后不再注册新的 —— 每次刷新拿到的都是服务器上的最新文件。 */
(function () {
  'use strict';
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (rs) {
        rs.forEach(function (r) { r.unregister(); });
      }).catch(function () {});
    }
  } catch (e) {}
  try {
    if (window.caches && caches.keys) {
      caches.keys().then(function (ks) { ks.forEach(function (k) { caches.delete(k); }); }).catch(function () {});
    }
  } catch (e) {}
})();

/* ============================================
   强制白天模式（用户明确要求：不要黑乎乎的深色）
   桌面端和手机端都生效：即使设置里选了深色，加载后也会被切回白天。
   ============================================ */
(function () {
  'use strict';
  function stripDark() {
    try {
      var html = document.documentElement;
      if (html && html.classList.contains('dark')) html.classList.remove('dark');
      if (document.body && document.body.classList.contains('dark')) document.body.classList.remove('dark');
      if (html && html.getAttribute('data-theme') === 'dark') html.removeAttribute('data-theme');
    } catch (e) {}
  }
  // 把已保存的深色设置改回白天
  try {
    var s = JSON.parse(localStorage.getItem('xingxing_settings') || '{}');
    if (s && s.theme === 'dark') {
      s.theme = 'light';
      localStorage.setItem('xingxing_settings', JSON.stringify(s));
    }
    if (localStorage.getItem('xingxing_theme') === 'dark') localStorage.setItem('xingxing_theme', 'light');
  } catch (e) {}

  stripDark();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', stripDark);
  window.addEventListener('load', stripDark);
  // 设置面板里如果又切到深色，这里立刻拉回来
  try {
    new MutationObserver(stripDark).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  } catch (e) {}
  var n = 0;
  var timer = setInterval(function () { stripDark(); if (++n > 25) clearInterval(timer); }, 400);
})();

/* ============================================
   目标图谱 · 手机版「四象限书柜」
   每个目标是一本书，按四象限摆在四个格子里；
   点一本书，打开这个目标的专属页面。宽屏不启用。
   ============================================ */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;
  if (!document.querySelector('.okr-list-card')) return;   // 只在目标页生效

  var QUADS = [
    { key: 'q1', name: '重要 · 紧急', hint: '今天就该动' },
    { key: 'q2', name: '重要 · 不紧急', hint: '长期要养的' },
    { key: 'q3', name: '紧急 · 不重要', hint: '赶紧处理掉' },
    { key: 'q4', name: '不急不重要', hint: '有空再说' }
  ];
  var STATUS = {
    active: { text: '修行中', cls: 'st-doing' },
    done:   { text: '已圆满', cls: 'st-done' },
    risk:   { text: '有阻滞', cls: 'st-blocked' }
  };

  function readOkrs() {
    try {
      var raw = JSON.parse(localStorage.getItem('xingxing_okrs') || '[]');
      return Array.isArray(raw) ? raw : (raw.okrs || []);
    } catch (e) { return []; }
  }
  function writeOkrs(list) {
    try { localStorage.setItem('xingxing_okrs', JSON.stringify(list)); } catch (e) {}
  }
  function krsOf(o) {
    return (o.keyResults || []).map(function (k) {
      return typeof k === 'string'
        ? { title: k, progress: 0 }
        : { title: k.title || '', progress: Number(k.progress) || 0 };
    });
  }
  function avgOf(o) {
    var k = krsOf(o);
    if (!k.length) return Number(o.progress) || 0;
    return Math.round(k.reduce(function (a, x) { return a + x.progress; }, 0) / k.length);
  }
  function contribution() {
    var T = window.XingxingTasks;
    try { return T ? T.okrContribution() : {}; } catch (e) { return {}; }
  }
  // Q1C：默认按规则自动分，创建时或专属页里都能改
  function quadrantOf(o, contrib) {
    if (o.quadrant && o.quadrant !== 'auto') return o.quadrant;
    var urgent = !!(contrib[o.id]) || o.status === 'risk';
    var important = /核心/.test(o.category || '') || avgOf(o) >= 30;
    if (important && urgent) return 'q1';
    if (important) return 'q2';
    if (urgent) return 'q3';
    return 'q4';
  }

  function build() {
    var list = readOkrs();
    if (!list.length) return;
    var contrib = contribution();

    var shelf = document.createElement('div');
    shelf.className = 'xx-okr-shelf';
    shelf.id = 'xxOkrShelf';
    shelf.innerHTML =
        '<div class="shelf-title">我的目标书柜</div>'
      + '<div class="okr-quad-grid">' + QUADS.map(function (q) {
          var books = list.filter(function (o) { return quadrantOf(o, contrib) === q.key; });
          return '<div class="okr-quad"><div class="okr-quad-head">' + q.name
            + '<span>' + q.hint + '</span></div><div class="okr-quad-books">'
            + (books.length ? books.map(function (o) {
                var st = STATUS[o.status] || STATUS.active;
                return '<button class="okr-book ' + st.cls + '" data-goal="' + o.id + '">'
                  + '<span class="okr-book-name">' + o.title + '</span>'
                  + '<span class="okr-book-meta">' + (o.category || '未分类') + ' · ' + avgOf(o) + '% · ' + st.text + '</span>'
                  + '</button>';
              }).join('') : '<div class="okr-book-empty">这一格还没有书</div>')
            + '</div></div>';
        }).join('') + '</div>'
      + '<div class="shelf-tip">点一本书，打开这个目标的专属页面</div>';

    var actionBar = document.querySelector('.action-bar');
    var topbar = document.querySelector('header.topbar, .topbar');
    if (actionBar && actionBar.parentNode) actionBar.parentNode.insertBefore(shelf, actionBar.nextSibling);
    else if (topbar && topbar.parentNode) topbar.insertAdjacentElement('afterend', shelf);
    else document.body.appendChild(shelf);

    document.body.classList.add('xx-okr-shelf-on');

    /* ---------- 目标专属页 ---------- */
    var sheet = document.createElement('div');
    sheet.className = 'xx-sheet';
    sheet.id = 'xxGoalSheet';
    sheet.innerHTML = '<div class="xx-sheet-head">'
      + '<button class="xx-sheet-back" type="button">‹ 书柜</button>'
      + '<span class="xx-sheet-title"></span></div>'
      + '<div class="xx-sheet-body"></div>';
    document.body.appendChild(sheet);

    function openGoal(id) {
      var o = readOkrs().filter(function (x) { return x.id === id; })[0];
      if (!o) return;
      var st = STATUS[o.status] || STATUS.active;
      var c = contribution()[o.id];
      var p = avgOf(o);
      var quad = quadrantOf(o, contribution());

      var html = '<div class="goal-head"><div class="goal-title">' + o.title + '</div>'
        + '<div class="goal-tags"><span class="chip">' + (o.category || '未分类') + '</span>'
        + '<span class="chip ' + st.cls + '">' + st.text + '</span>'
        + '<span class="chip">' + QUADS.filter(function (q) { return q.key === quad; })[0].name + '</span></div></div>';

      html += '<div class="goal-progress"><div class="gp-bar"><span style="width:' + p + '%"></span></div>'
        + '<div class="gp-text">总进度 ' + p + '%</div></div>';

      var ks = krsOf(o);
      html += '<div class="goal-section-title">关键结果</div>';
      html += ks.length ? '<div class="goal-krs">' + ks.map(function (k) {
        return '<div class="goal-kr"><div class="gk-top"><span>' + k.title + '</span><b>' + k.progress + '%</b></div>'
          + '<div class="gk-bar"><span style="width:' + k.progress + '%"></span></div></div>';
      }).join('') + '</div>' : '<div class="sheet-empty">还没有设关键结果</div>';

      html += '<div class="goal-section-title">今日投入</div>';
      html += c
        ? '<div class="goal-today">已完成 ' + c.done + '/' + c.tasks.length + ' 项 · 投入 '
          + (window.XingxingTasks ? XingxingTasks.fmtMinutes(c.minutes) : c.minutes + ' 分钟') + '</div>'
        : '<div class="goal-today">今天还没有和这个目标相关的计划</div>';

      html += '<div class="goal-section-title">放进哪个格子</div><div class="quad-switch">'
        + QUADS.map(function (q) {
            return '<button class="quad-btn' + (quad === q.key ? ' on' : '') + '" data-quad="' + q.key + '">' + q.name + '</button>';
          }).join('')
        + '<button class="quad-btn' + (!o.quadrant || o.quadrant === 'auto' ? ' on' : '') + '" data-quad="auto">自动</button></div>'
        + '<div class="shelf-tip">“自动”规则：今天有任务的算紧急，门派带“核心”或进度过 30% 的算重要</div>';

      sheet.querySelector('.xx-sheet-title').textContent = '🎯 ' + o.title;
      sheet.setAttribute('data-goal-id', o.id);
      sheet.querySelector('.xx-sheet-body').innerHTML = html;
      document.body.classList.add('xx-sheet-open');
    }

    function closeSheet() { document.body.classList.remove('xx-sheet-open'); }

    shelf.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-goal]') : null;
      if (b) openGoal(b.getAttribute('data-goal'));
    });
    sheet.querySelector('.xx-sheet-back').addEventListener('click', closeSheet);
    sheet.addEventListener('click', function (e) {
      var q = e.target.closest ? e.target.closest('[data-quad]') : null;
      if (!q) return;
      var id = sheet.getAttribute('data-goal-id');
      var all = readOkrs();
      var o = all.filter(function (x) { return x.id === id; })[0];
      if (!o) return;
      o.quadrant = q.getAttribute('data-quad');
      writeOkrs(all);
      closeSheet();
      var fresh = document.getElementById('xxOkrShelf');
      if (fresh && fresh.parentNode) fresh.parentNode.removeChild(fresh);
      document.body.classList.remove('xx-okr-shelf-on');
      build();
    });
  }

  // 立刻建书柜（不再延迟），避免先闪一下原来的长列表
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

/* ============================================
   刻意练习本 · 手机版专属页
   「查看统计分析」和「点击某道错题」都改成整屏专属页，
   不再是在原页面里往下滑、也不再用小弹窗。宽屏不启用。
   ============================================ */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;

  var statsPanel = document.getElementById('statsPanel');
  var detailModal = document.getElementById('detailModal');
  var detailBody = document.getElementById('detailBody');
  if (!statsPanel || !detailModal || !detailBody) return;   // 只在刻意练习本页生效

  var sheet = document.createElement('div');
  sheet.className = 'xx-sheet';
  sheet.id = 'xxErrSheet';
  sheet.innerHTML = '<div class="xx-sheet-head">'
    + '<button class="xx-sheet-back" type="button">‹ 返回</button>'
    + '<span class="xx-sheet-title"></span></div>'
    + '<div class="xx-sheet-body"></div>';
  document.body.appendChild(sheet);

  var sheetTitle = sheet.querySelector('.xx-sheet-title');
  var sheetBody = sheet.querySelector('.xx-sheet-body');
  var moved = null;

  function restoreMoved() {
    if (!moved) return;
    if (moved.next && moved.next.parentNode === moved.parent) moved.parent.insertBefore(moved.el, moved.next);
    else moved.parent.appendChild(moved.el);
    moved = null;
  }
  function closeSheet() {
    document.body.classList.remove('xx-sheet-open');
    restoreMoved();
    sheetBody.innerHTML = '';
  }
  function openSheet(title) {
    sheetTitle.textContent = title;
    document.body.classList.add('xx-sheet-open');
    sheetBody.scrollTop = 0;
  }

  // ① 统计分析 → 专属页（把统计面板整块搬进来）
  function openStats() {
    restoreMoved();
    sheetBody.innerHTML = '';
    moved = { el: statsPanel, parent: statsPanel.parentNode, next: statsPanel.nextSibling };
    sheetBody.appendChild(statsPanel);
    openSheet('📊 统计分析');
  }

  // ② 错题详情 → 专属页（借用原页面的渲染，再整块搬过来）
  function openError(id) {
    restoreMoved();
    sheetBody.innerHTML = '';
    try {
      if (typeof window.originalOpenDetail === 'function') window.originalOpenDetail(id);
    } catch (e) {}
    var html = detailBody.innerHTML;
    sheetBody.innerHTML = html || '<div class="sheet-empty">没有找到这道错题。</div>';
    try { if (typeof window.closeModal === 'function') window.closeModal('detailModal'); } catch (e) {}
    // 详情里如果有“关闭弹窗”的按钮，改成关闭专属页
    Array.prototype.forEach.call(sheetBody.querySelectorAll('[onclick*="detailModal"]'), function (el) {
      el.setAttribute('onclick', '');
      el.addEventListener('click', closeSheet);
    });
    openSheet('📕 错题详情');
  }

  // 接管原来的 openDetail
  if (typeof window.openDetail === 'function') window.originalOpenDetail = window.openDetail;
  window.openDetail = openError;

  // 接管“查看统计分析”按钮（换掉原监听，避免又展开原面板）
  var toggle = document.getElementById('mobileStatsToggle');
  if (toggle && toggle.parentNode) {
    var fresh = toggle.cloneNode(true);
    fresh.className = 'mobile-stats-toggle';
    fresh.textContent = '📊 查看统计分析';
    toggle.parentNode.replaceChild(fresh, toggle);
    fresh.addEventListener('click', openStats);
  }

  sheet.querySelector('.xx-sheet-back').addEventListener('click', closeSheet);
})();

/* ============================================
   手机端零散补丁（只在对应页面生效）
   1) 一键充电：点一下就记一次，不用填表
   2) 今日行醒：把「内外耗」提到上半部分
   3) 移动端不做点灯人：误进该页自动回复盘
   ============================================ */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;
  var page = (location.pathname.split('/').pop() || '').toLowerCase();

  // 1) 一键充电
  window.xxQuickCharge = function () {
    try {
      if (typeof window.openChargeRecordModal === 'function' && typeof window.saveChargeRecord === 'function') {
        window.openChargeRecordModal('sleep');   // 填充当前精力，并给默认恢复量
        window.saveChargeRecord();               // 直接记账
        if (window.XingxingCommon && XingxingCommon.showToast) {
          XingxingCommon.showToast('已记一次充电 ⚡ 精力回来了', 'success', 1800);
        }
      } else {
        location.href = 'dashboard.html';
      }
    } catch (e) {
      if (window.XingxingCommon && XingxingCommon.showToast) {
        XingxingCommon.showToast('充电没成功，点「更多 → 今日行醒」再试', 'warning', 2200);
      }
    }
  };

  // 2) 今日行醒：把内外耗那一段挪到精气神下面
  if (page === 'dashboard.html') {
    setTimeout(function () {
      var drain = document.querySelector('.mobile-drain-section');
      var rings = document.querySelector('.four-rings-section, .energy-rings-section');
      if (!drain) return;
      var anchor = rings || document.querySelector('.mobile-frog-card');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(drain, anchor.nextSibling);
    }, 1500);
  }

  // 3) 移动端不做点灯人
  if (page === 'light-keeper.html') {
    location.replace('review.html');
  }
})();

/* ============================================
   手机端顶栏统一：左边「时间 + 太阳」，右边「个人头像」
   - 汉堡按钮在手机上是多余的（侧栏已经隐藏），隐藏掉
   - 点右上角头像 → 弹出「我的」面板（个人档案 / 知识库 / 速记 / 设置）
   ============================================ */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;

  function avatarText() {
    try {
      var p = window.XingxingProfile && XingxingProfile.get ? XingxingProfile.get() : null;
      var n = (p && p.nickname) || '';
      if (!n) {
        var u = window.XingXingAPI && XingXingAPI.getUser ? XingXingAPI.getUser() : null;
        n = (u && (u.nickname || u.username)) || '';
      }
      if (n) {
        if (p && p.avatar && p.avatar.indexOf('data:') !== 0) return p.avatar;
        return n.charAt(0);
      }
    } catch (e) {}
    return '我';
  }

  function patch() {
    var pageName = (location.pathname.split('/').pop() || '').toLowerCase();
    var header = document.querySelector('header.topbar, header.mobile-topbar, .topbar, .mobile-topbar');
    if (!header) {
      if (pageName !== 'dashboard.html' && pageName !== 'login.html' && !document.querySelector('.xx-back-btn')) {
        var floating = document.createElement('button');
        floating.className = 'xx-back-btn xx-back-floating';
        floating.type = 'button';
        floating.title = '返回上一页';
        floating.setAttribute('aria-label', '返回上一页');
        floating.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>';
        floating.addEventListener('click', function () { window.xxMobileBack('dashboard.html'); });
        document.body.appendChild(floating);
        document.body.classList.add('xx-has-floating-back');
      }
      return;
    }

    // 1) 隐藏汉堡按钮（手机上没有侧栏可开）
    Array.prototype.forEach.call(
      header.querySelectorAll('#mobileMenuBtn, .hamburger-btn, .mobile-menu-btn, .menu-btn'),
      function (b) { b.style.display = 'none'; }
    );

    // 2) 把「时间」和「太阳/月亮」挪到顶栏左侧
    var left = header.querySelector('.topbar-left') || header;
    var timeEl = header.querySelector('#topbarTime, .time-display, .topbar-time');
    var themeBtn = header.querySelector('.theme-btn');
    if (timeEl && timeEl.parentNode !== left) left.appendChild(timeEl);
    if (themeBtn && themeBtn.parentNode !== left) left.appendChild(themeBtn);
    if (left.classList) left.classList.add('xx-topbar-left');

    if (pageName !== 'dashboard.html' && pageName !== 'login.html' && !left.querySelector('.xx-back-btn')) {
      var backBtn = document.createElement('button');
      backBtn.className = 'xx-back-btn';
      backBtn.type = 'button';
      backBtn.title = '返回上一页';
      backBtn.setAttribute('aria-label', '返回上一页');
      backBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>';
      backBtn.addEventListener('click', function () { window.xxMobileBack('dashboard.html'); });
      left.insertBefore(backBtn, left.firstChild);
    }

    // 3) 右侧放头像，点开「我的」
    var right = header.querySelector('.topbar-right') || header;
    if (!right.querySelector('.xx-avatar-btn')) {
      var btn = document.createElement('button');
      btn.className = 'xx-avatar-btn';
      btn.type = 'button';
      btn.title = '我的';
      btn.textContent = avatarText();
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var panel = document.getElementById('xxMinePanel');
        if (!panel) {
          // 有些页面没有底栏（带自己 tabbar 的首页），这里兜底建一个
          var p2 = document.createElement('div');
          p2.className = 'xx-more-panel';
          p2.id = 'xxMinePanel';
          p2.innerHTML = '<div class="xx-more-title">我的</div>'
            + '<div class="xx-more-grid">'
            + '<a href="profile.html"><i>⚙</i>个人设置</a>'
            + '<a href="resources.html"><i>📚</i>知识库</a>'
            + '<a href="annotate.html"><i>📷</i>速记助理</a>'
            + '</div><button class="xx-more-close" type="button">收起</button>';
          document.body.appendChild(p2);
          p2.querySelector('.xx-more-close').addEventListener('click', function () { p2.classList.remove('on'); });
          panel = p2;
        }
        panel.classList.toggle('on');
      });
      right.appendChild(btn);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(patch, 400); });
  else setTimeout(patch, 400);
  setTimeout(patch, 1600);   // 有些页面的顶栏是脚本后渲染的，再补一次
})();

/* ============================================
   今日行醒 · 手机版首页入口重构
   - 青蛙任务 → 能量观测站（内外耗诊断专属页）
   - 快速充电 → 充电站专属页（图 2 那种）
   - 今日错题 → 认知重构（专属页 + 本地记录）
   - 速记助理 → 保留为并列入口
   ============================================ */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;
  if ((location.pathname.split('/').pop() || '') !== 'dashboard.html') return;

  var CR_KEY = 'xingxing_cognitive';
  var BIASES = ['非黑即白', '灾难化想象', '以偏概全', '读心术', '应该式', '否定积极面'];

  function readCR() {
    try { return JSON.parse(localStorage.getItem(CR_KEY) || '[]') || []; } catch (e) { return []; }
  }
  function writeCR(list) {
    try { localStorage.setItem(CR_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---------- 通用「专属页」容器 ----------
  var sheet = document.createElement('div');
  sheet.className = 'xx-sheet';
  sheet.id = 'xxHomeSheet';
  sheet.innerHTML = '<div class="xx-sheet-head">'
    + '<button class="xx-sheet-back" type="button">‹ 返回</button>'
    + '<span class="xx-sheet-title"></span></div>'
    + '<div class="xx-sheet-body"></div>';
  document.body.appendChild(sheet);

  var titleEl = sheet.querySelector('.xx-sheet-title');
  var bodyEl = sheet.querySelector('.xx-sheet-body');
  var moved = null;

  function restore() {
    if (!moved) return;
    if (moved.next && moved.next.parentNode === moved.parent) moved.parent.insertBefore(moved.el, moved.next);
    else moved.parent.appendChild(moved.el);
    moved = null;
  }
  function closeSheet() {
    document.body.classList.remove('xx-sheet-open');
    restore();
    bodyEl.innerHTML = '';
  }
  function openSheet(title, node) {
    restore();
    bodyEl.innerHTML = '';
    titleEl.textContent = title;
    if (node) {
      moved = { el: node, parent: node.parentNode, next: node.nextSibling };
      bodyEl.appendChild(node);
    }
    document.body.classList.add('xx-sheet-open');
    bodyEl.scrollTop = 0;
  }
  sheet.querySelector('.xx-sheet-back').addEventListener('click', closeSheet);

  // ---------- 认知重构专属页 ----------
  var picked = [];
  function renderCR() {
    var list = readCR();
    var html = '<div class="cr-tip">把脑子里那句话拆开看看：它有多少是真的？</div>'
      + '<div class="cr-field"><label class="cr-label">① 那句让你难受的念头</label>'
      + '<textarea class="cr-area" id="crThought" placeholder="例：我这次雅思肯定考不好"></textarea></div>'
      + '<div class="cr-field"><label class="cr-label">② 它属于哪种思维偏差（可多选）</label>'
      + '<div class="cr-chips" id="crChips">' + BIASES.map(function (b) {
          return '<button class="cr-chip" type="button" data-bias="' + b + '">' + b + '</button>';
        }).join('') + '</div></div>'
      + '<div class="cr-field"><label class="cr-label">③ 找反证：现实里有哪些不支持这句话的事实？</label>'
      + '<textarea class="cr-area" id="crEvidence" placeholder="例：上次听力提了 0.5，练了是有用的"></textarea></div>'
      + '<div class="cr-field"><label class="cr-label">④ 换一句更平衡的说法</label>'
      + '<textarea class="cr-area" id="crBalanced" placeholder="例：这次准备确实不够，但我知道哪些地方能补"></textarea></div>'
      + '<button class="cr-save" type="button" id="crSave">存下来</button>'
      + '<div class="cr-history-title">最近的记录</div>'
      + (list.length ? list.slice(0, 8).map(function (r) {
          return '<div class="cr-item"><div class="cr-item-thought">' + esc(r.thought) + '</div>'
            + (r.biases && r.biases.length ? '<div class="cr-item-tags">' + r.biases.map(function (b) { return '<span class="chip">' + esc(b) + '</span>'; }).join('') + '</div>' : '')
            + (r.balanced ? '<div class="cr-item-balanced">↔ ' + esc(r.balanced) + '</div>' : '')
            + '<div class="cr-item-date">' + esc(r.date) + '</div></div>';
        }).join('') : '<div class="cr-empty">还没有记录，写下第一条试试</div>');

    bodyEl.innerHTML = html;

    bodyEl.querySelectorAll('.cr-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        var b = c.getAttribute('data-bias');
        var i = picked.indexOf(b);
        if (i > -1) { picked.splice(i, 1); c.classList.remove('on'); }
        else { picked.push(b); c.classList.add('on'); }
      });
    });
    bodyEl.querySelector('#crSave').addEventListener('click', function () {
      var thought = bodyEl.querySelector('#crThought').value.trim();
      if (!thought) {
        if (window.XingxingCommon && XingxingCommon.showToast) XingxingCommon.showToast('先写下那句念头', 'warning', 1800);
        return;
      }
      var list2 = readCR();
      list2.unshift({
        id: 'cr' + Date.now(),
        date: today(),
        thought: thought,
        biases: picked.slice(),
        evidence: bodyEl.querySelector('#crEvidence').value.trim(),
        balanced: bodyEl.querySelector('#crBalanced').value.trim()
      });
      writeCR(list2);
      picked = [];
      if (window.XingxingCommon) {
        try { XingxingCommon.addPoints(3, '认知重构'); } catch (e) {}
        if (XingxingCommon.showToast) XingxingCommon.showToast('存好了，念头松动了一点', 'success', 1800);
      }
      renderCR();
    });
  }

  // ---------- 三个专属页的入口（卡片文字已经在 HTML 里写好了，不会闪）----------
  window.xxEnergyStation = function () {
    var panel = document.querySelector('.col-card.leak-diagnosis');
    if (panel) openSheet('🔋 能量观测站', panel);
  };
  window.xxChargeStation = function () {
    var panel = document.getElementById('chargeSmartModule');
    if (panel) openSheet('⚡ 今日充电 · 能量补给站', panel);
  };
  window.xxCognitive = function () {
    picked = [];
    openSheet('🧠 认知重构');
    renderCR();
  };
})();

/* ============================================
   复盘 · 手机端事务脉络：
   放大节点群，增加球形光晕、轨道环和缓慢空间浮动。
   只改变表现层，不改节点数据与连线关系。
   ============================================ */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;
  if ((location.pathname.split('/').pop() || '').toLowerCase() !== 'review.html') return;

  var svg = document.getElementById('graphSvg');
  var edges = document.getElementById('graphEdges');
  var nodes = document.getElementById('graphNodes');
  if (!svg || !edges || !nodes || document.getElementById('xxGraphScene')) return;

  var NS = 'http://www.w3.org/2000/svg';
  function make(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      el.setAttribute(key, attrs[key]);
    });
    return el;
  }

  var defs = svg.querySelector('defs');
  if (defs && !document.getElementById('xx-graph-sphere-glow')) {
    var gradient = make('radialGradient', {
      id: 'xx-graph-sphere-glow',
      cx: '50%',
      cy: '46%',
      r: '54%'
    });
    gradient.appendChild(make('stop', { offset: '0%', 'stop-color': '#fff6df', 'stop-opacity': '.86' }));
    gradient.appendChild(make('stop', { offset: '42%', 'stop-color': '#e8cba3', 'stop-opacity': '.38' }));
    gradient.appendChild(make('stop', { offset: '72%', 'stop-color': '#8eb6b0', 'stop-opacity': '.16' }));
    gradient.appendChild(make('stop', { offset: '100%', 'stop-color': '#8eb6b0', 'stop-opacity': '0' }));
    defs.appendChild(gradient);
  }

  var backdrop = make('g', { id: 'xxGraphBackdrop', 'aria-hidden': 'true' });
  backdrop.appendChild(make('circle', {
    class: 'xx-graph-orb',
    cx: '400',
    cy: '240',
    r: '190',
    fill: 'url(#xx-graph-sphere-glow)'
  }));
  backdrop.appendChild(make('ellipse', {
    class: 'xx-graph-ring ring-one',
    cx: '400',
    cy: '240',
    rx: '188',
    ry: '66'
  }));
  backdrop.appendChild(make('ellipse', {
    class: 'xx-graph-ring ring-two',
    cx: '400',
    cy: '240',
    rx: '146',
    ry: '48'
  }));

  [
    [220, 240, 0],
    [304, 123, .8],
    [400, 174, 1.6],
    [496, 123, 2.4],
    [580, 240, 3.2],
    [496, 357, 4.0],
    [400, 306, 4.8],
    [304, 357, 5.6]
  ].forEach(function (point, index) {
    backdrop.appendChild(make('circle', {
      class: 'xx-graph-orbit-dot',
      cx: point[0],
      cy: point[1],
      r: index % 3 === 0 ? '4.2' : '3',
      style: 'animation-delay:' + point[2] + 's'
    }));
  });

  var scene = make('g', { id: 'xxGraphScene' });
  svg.insertBefore(backdrop, edges);
  svg.insertBefore(scene, edges);
  scene.appendChild(edges);
  scene.appendChild(nodes);
})();

/* 行星视图：复用旧 SVG，替换为事务节点、中心星体与关联边。 */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;
  if ((location.pathname.split('/').pop() || '').toLowerCase() !== 'review.html') return;

  var svg = document.getElementById('graphSvg');
  var oldScene = document.getElementById('xxGraphScene');
  if (!svg || !oldScene || document.getElementById('xxPlanetView')) return;

  var NS = 'http://www.w3.org/2000/svg';
  var CX = 400;
  var CY = 245;

  function make(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    return el;
  }

  function labelOf(value) {
    var text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > 9 ? text.slice(0, 9) + '…' : text;
  }

  function inferType(title) {
    var t = String(title || '');
    if (/跑|健身|运动|训练|散步|力量|身体/.test(t)) return 'body';
    if (/复盘|总结|回顾/.test(t)) return 'review';
    if (/睡|休息|午睡|冥想|补给/.test(t)) return 'rest';
    if (/灵感|速记|笔记|随笔|点子/.test(t)) return 'note';
    if (/认知|转念|反思/.test(t)) return 'insight';
    if (/知识|论文|读书|学习|复习|精读|刷题/.test(t)) return 'learning';
    if (/目标|雅思|考试|面试|Offer|投递|内推/.test(t)) return 'goal';
    if (/打卡|习惯|作息/.test(t)) return 'habit';
    if (/任务|计划|工作/.test(t)) return 'task';
    return 'task';
  }

  function inferThemes(title, type) {
    var t = String(title || '');
    var themes = [];
    if (/简历|面试|校招|内推|Offer|投递|就业|招聘|岗位|专业课/.test(t) || type === 'goal') themes.push('就业');
    if (/论文|读书|学习|复习|精读|刷题|雅思|听力|阅读|写作|口语|知识/.test(t) || type === 'learning') themes.push('学习');
    if (/跑|健身|运动|训练|散步|力量|身体|睡|休息|午睡|冥想|补给|作息|健康/.test(t) || type === 'body' || type === 'rest' || type === 'habit') themes.push('健康');
    if (/复盘|总结|回顾|灵感|速记|认知|反思/.test(t) || type === 'review' || type === 'note' || type === 'insight') {
      themes.push('学习');
    }
    if (!themes.length) themes.push('学习');
    return themes.filter(function (theme, index) { return themes.indexOf(theme) === index; });
  }

  var mock = [
    ['观影随笔', 'note'], ['突发点子', 'note'], ['灵感速记', 'note'],
    ['冥想 10 分', 'rest'], ['读书摘抄', 'learning'], ['散步', 'body'],
    ['作息调整', 'habit'], ['月总结', 'review'], ['午睡补给', 'rest'],
    ['力量训练', 'body'], ['论文精读', 'learning'], ['周复盘', 'review'],
    ['行测练习', 'learning'], ['定期复盘', 'review'], ['晨跑 5km', 'body'],
    ['简历精析', 'goal'], ['模拟面试', 'goal'], ['校招内推', 'goal'],
    ['投递字节', 'goal'], ['牛客刷题', 'learning'], ['专业课复习', 'learning'],
    ['Offer 沟通', 'goal']
  ];

  var actual = [];
  try {
    if (window.XingxingTasks && XingxingTasks.getTasks) {
      actual = XingxingTasks.getTasks().slice(0, 5).map(function (task) {
        return [labelOf(task.name), inferType(task.name)];
      });
    }
  } catch (e) {}

  var seen = {};
  var nodes = actual.concat(mock).filter(function (item) {
    var key = item[0];
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  }).slice(0, 21);

  var count = nodes.length;
  var golden = Math.PI * (3 - Math.sqrt(5));

  nodes.forEach(function (node, index) {
    var y3 = count > 1 ? 1 - (index / (count - 1)) * 2 : 0;
    var ring = Math.sqrt(Math.max(0, 1 - y3 * y3));
    var theta = index * golden;
    node.title = labelOf(node[0]);
    node.type = node[1] || 'task';
    node.themes = inferThemes(node.title, node.type);
    try {
      var savedAssignments = JSON.parse(localStorage.getItem('xingxing_planet_assignments') || '{}');
      if (savedAssignments[node.title] && savedAssignments[node.title].length) {
        node.themes = savedAssignments[node.title];
      }
    } catch (e) {}
    node.x3 = Math.cos(theta) * ring;
    node.y3 = y3;
    node.z = Math.sin(theta) * ring;
  });

  nodes.sort(function (a, b) { return a.z - b.z; });
  window.__xxPlanetNodes = nodes;

  var defs = svg.querySelector('defs');
  if (defs && !document.getElementById('xx-planet-core-gradient')) {
    var coreGradient = make('radialGradient', {
      id: 'xx-planet-core-gradient',
      cx: '50%',
      cy: '45%',
      r: '58%'
    });
    coreGradient.appendChild(make('stop', { offset: '0%', 'stop-color': '#fffdf5', 'stop-opacity': '.98' }));
    coreGradient.appendChild(make('stop', { offset: '34%', 'stop-color': '#f5d39b', 'stop-opacity': '.84' }));
    coreGradient.appendChild(make('stop', { offset: '68%', 'stop-color': '#f2a0a0', 'stop-opacity': '.48' }));
    coreGradient.appendChild(make('stop', { offset: '100%', 'stop-color': '#f2a0a0', 'stop-opacity': '0' }));
    defs.appendChild(coreGradient);
  }

  function project(node) {
    var depth = (node.z + 1) / 2;
    var perspective = .72 + depth * .48;
    return {
      x: CX + node.x3 * 230 * perspective,
      y: CY + node.y3 * 160 * perspective,
      r: (node.type === 'goal' ? 30 : 25) * (.78 + depth * .34),
      depth: depth,
      perspective: perspective
    };
  }

  var edgeLayer = make('g', { class: 'xx-planet-edges', 'aria-hidden': 'true' });
  nodes.forEach(function (node, index) {
    var p = project(node);
    edgeLayer.appendChild(make('line', {
      class: 'xx-planet-edge ' + (p.depth < .5 ? 'back' : 'front') + (index % 4 === 0 ? ' strong' : ''),
      x1: CX,
      y1: CY,
      x2: p.x,
      y2: p.y,
      opacity: (.16 + p.depth * .34).toFixed(2)
    }));

    var next = nodes[(index + 1) % nodes.length];
    var q = project(next);
    if (Math.abs(node.z - next.z) < .5) {
      edgeLayer.appendChild(make('line', {
        class: 'xx-planet-edge ' + (p.depth < .5 ? 'back' : 'front'),
        x1: p.x,
        y1: p.y,
        x2: q.x,
        y2: q.y,
        opacity: (.10 + Math.min(p.depth, q.depth) * .20).toFixed(2)
      }));
    }
  });

  function nodeGroup(node) {
    var p = project(node);
    var back = node.z < 0;
    var g = make('g', {
      class: 'xx-planet-node type-' + node.type + (back ? ' back' : ' front'),
      transform: 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')'
    });
    g.appendChild(make('circle', { class: 'node-wash', r: (p.r * 1.42).toFixed(1) }));
    g.appendChild(make('circle', { class: 'node-body', r: p.r.toFixed(1) }));
    g.appendChild(make('circle', {
      class: 'node-shine',
      cx: (-p.r * .32).toFixed(1),
      cy: (-p.r * .34).toFixed(1),
      r: Math.max(2.8, p.r * .16).toFixed(1)
    }));
    var title = make('title');
    title.textContent = node.title;
    g.appendChild(title);

    var labelX;
    var labelY;
    var labelAnchor;
    if (Math.abs(node.x3) < .34) {
      labelX = '0';
      labelY = node.y3 > 0 ? (p.r + 18) : (-p.r - 9);
      labelAnchor = 'middle';
    } else {
      labelX = (p.x < CX ? -(p.r + 12) : (p.r + 12)).toFixed(1);
      labelY = '6';
      labelAnchor = p.x < CX ? 'end' : 'start';
    }

    var label = make('text', {
      class: 'xx-planet-label',
      x: labelX,
      y: labelY,
      'text-anchor': labelAnchor
    });
    label.textContent = node.title;
    g.appendChild(label);
    return g;
  }

  var planet = make('g', { id: 'xxPlanetView' });
  var backLayer = make('g', { class: 'xx-planet-back' });
  var frontLayer = make('g', { class: 'xx-planet-front' });
  nodes.forEach(function (node) {
    (node.z < 0 ? backLayer : frontLayer).appendChild(nodeGroup(node));
  });

  var core = make('g', { class: 'xx-planet-core' });
  core.appendChild(make('circle', { class: 'xx-planet-core-glow', cx: CX, cy: CY, r: '90' }));
  core.appendChild(make('circle', { class: 'xx-planet-core-dot', cx: CX, cy: CY, r: '34' }));
  var coreLabel = make('text', {
    class: 'xx-planet-core-label',
    x: CX,
    y: CY - 2,
    'text-anchor': 'middle'
  });
  coreLabel.textContent = '今日';
  core.appendChild(coreLabel);
  var coreSub = make('text', {
    class: 'xx-planet-core-sub',
    x: CX,
    y: CY + 24,
    'text-anchor': 'middle'
  });
  coreSub.textContent = '行醒';
  core.appendChild(coreSub);

  planet.appendChild(edgeLayer);
  planet.appendChild(backLayer);
  planet.appendChild(core);
  planet.appendChild(frontLayer);
  svg.insertBefore(planet, oldScene);
  oldScene.style.display = 'none';

  var container = document.getElementById('graphContainer');
  if (container) {
    var oldZoomBar = document.getElementById('xxPlanetZoom');
    if (oldZoomBar && oldZoomBar.parentNode) oldZoomBar.parentNode.removeChild(oldZoomBar);

    var rotX = -4;
    var rotY = 0;
    var velocityX = 0;
    var velocityY = 0;
    var dragging = false;
    var moved = false;
    var lastX = 0;
    var lastY = 0;

    container.classList.add('xx-planet-drag');
    container.style.touchAction = 'none';

    function renderRotation() {
      planet.style.setProperty('--planet-rot-x', rotX.toFixed(2) + 'deg');
      planet.style.setProperty('--planet-rot-y', rotY.toFixed(2) + 'deg');
    }

    function animateRotation() {
      if (!planet.isConnected) return;
      if (!dragging) {
        rotY += .12 + velocityY;
        rotX += velocityX;
        rotX = Math.max(-68, Math.min(68, rotX));
        velocityY *= .94;
        velocityX *= .94;
        if (Math.abs(velocityY) < .008) velocityY = 0;
        if (Math.abs(velocityX) < .008) velocityX = 0;
        renderRotation();
      }
      requestAnimationFrame(animateRotation);
    }

    container.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      moved = false;
      lastX = event.clientX;
      lastY = event.clientY;
      velocityX = 0;
      velocityY = 0;
      container.classList.add('is-dragging');
      try { container.setPointerCapture(event.pointerId); } catch (e) {}
      event.preventDefault();
    });

    container.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      var dx = event.clientX - lastX;
      var dy = event.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      lastX = event.clientX;
      lastY = event.clientY;
      rotY += dx * .55;
      rotX -= dy * .42;
      rotX = Math.max(-68, Math.min(68, rotX));
      velocityY = dx * .018;
      velocityX = -dy * .012;
      renderRotation();
      event.preventDefault();
    });

    function endDrag(event) {
      if (!dragging) return;
      dragging = false;
      container.classList.remove('is-dragging');
      try { container.releasePointerCapture(event.pointerId); } catch (e) {}
    }
    container.addEventListener('pointerup', endDrag);
    container.addEventListener('pointercancel', endDrag);
    container.addEventListener('click', function (event) {
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      }
    }, true);

    renderRotation();
    requestAnimationFrame(animateRotation);
  }
})();

/* 真正的 3D 球面投影：节点、标签和连线每帧重算，背面的内容不会镜像。 */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;
  if ((location.pathname.split('/').pop() || '').toLowerCase() !== 'review.html') return;

  var nodes = window.__xxPlanetNodes || [];
  var oldContainer = document.getElementById('graphContainer');
  var svg = document.getElementById('graphSvg');
  if (!nodes.length || !oldContainer || !svg) return;

  var oldPlanet = document.getElementById('xxPlanetView');
  if (oldPlanet && oldPlanet.parentNode) oldPlanet.parentNode.removeChild(oldPlanet);

  // 替换容器以清掉上一版 CSS 旋转的监听器，保留里面的 SVG。
  var container = oldContainer.cloneNode(false);
  while (oldContainer.firstChild) container.appendChild(oldContainer.firstChild);
  oldContainer.parentNode.replaceChild(container, oldContainer);
  container.classList.add('xx-planet-drag');
  container.style.touchAction = 'none';

  var NS = 'http://www.w3.org/2000/svg';
  var CX = 400;
  var CY = 245;
  var RX = 230;
  var RY = 160;

  function make(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    return el;
  }

  function baseRadius(node) {
    return node.type === 'goal' ? 30 : 25;
  }

  var zoom = 1;

  function project(node, rx, ry) {
    var cy = Math.cos(ry), sy = Math.sin(ry);
    var cx = Math.cos(rx), sx = Math.sin(rx);
    var x1 = node.x3 * cy + node.z * sy;
    var z1 = -node.x3 * sy + node.z * cy;
    var y2 = node.y3 * cx - z1 * sx;
    var z2 = node.y3 * sx + z1 * cx;
    var depth = (z2 + 1) / 2;
    var perspective = .72 + depth * .48;
    return {
      x: CX + x1 * RX * zoom * perspective,
      y: CY + y2 * RY * zoom * perspective,
      z: z2,
      depth: depth,
      r: baseRadius(node) * (.78 + depth * .34) * (.68 + zoom * .32)
    };
  }

  var edgeLayer = make('g', { class: 'xx-planet-edges-dynamic', 'aria-hidden': 'true' });
  var backLayer = make('g', { class: 'xx-planet-back-dynamic' });
  var frontLayer = make('g', { class: 'xx-planet-front-dynamic' });
  var core = make('g', { class: 'xx-planet-core' });

  var edgeRefs = nodes.map(function (node, index) {
    var centerLine = make('line', {
      class: 'xx-planet-edge ' + (index % 4 === 0 ? 'strong' : ''),
      x1: CX,
      y1: CY,
      x2: CX,
      y2: CY
    });
    edgeLayer.appendChild(centerLine);

    var next = nodes[(index + 1) % nodes.length];
    var neighborLine = make('line', {
      class: 'xx-planet-edge',
      x1: CX,
      y1: CY,
      x2: CX,
      y2: CY,
      opacity: '.12'
    });
    edgeLayer.appendChild(neighborLine);
    return { node: node, center: centerLine, neighbor: neighborLine, next: next };
  });

  var nodeRefs = nodes.map(function (node) {
    var group = make('g', { class: 'xx-planet-node type-' + node.type });
    var wash = make('circle', { class: 'node-wash' });
    var body = make('circle', { class: 'node-body' });
    var shine = make('circle', { class: 'node-shine' });
    var label = make('text', { class: 'xx-planet-label' });
    var title = make('title');
    title.textContent = node.title;
    label.textContent = node.title;
    group.appendChild(wash);
    group.appendChild(body);
    group.appendChild(shine);
    group.appendChild(title);
    group.appendChild(label);
    return { node: node, group: group, wash: wash, body: body, shine: shine, label: label };
  });

  core.appendChild(make('circle', { class: 'xx-planet-core-glow', cx: CX, cy: CY, r: '90' }));
  core.appendChild(make('circle', { class: 'xx-planet-core-dot', cx: CX, cy: CY, r: '34' }));
  var coreLabel = make('text', { class: 'xx-planet-core-label', x: CX, y: CY - 2, 'text-anchor': 'middle' });
  coreLabel.textContent = '今日';
  core.appendChild(coreLabel);
  var coreSub = make('text', { class: 'xx-planet-core-sub', x: CX, y: CY + 24, 'text-anchor': 'middle' });
  coreSub.textContent = '行醒';
  core.appendChild(coreSub);

  var planet = make('g', { id: 'xxPlanetView' });
  planet.appendChild(edgeLayer);
  planet.appendChild(backLayer);
  planet.appendChild(core);
  planet.appendChild(frontLayer);
  svg.appendChild(planet);

  var STAR_KEY = 'xingxing_theme_stars';
  var ACTIVE_STAR_KEY = 'xingxing_active_theme_star';
  var AI_CLASSIFY_KEY = 'xingxing_ai_classify';
  var STAR_PALETTE = ['#f2a0a0', '#C45C48', '#6FB6C9', '#5C8C77', '#4E6FA8', '#C08A4E', '#9AA6BC'];

  function readStars() {
    var list = null;
    try {
      var saved = JSON.parse(localStorage.getItem(STAR_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) list = saved;
    } catch (e) {}
    if (!list) {
      list = [
        { id: 'career', name: '就业', accent: '#f2a0a0' },
        { id: 'study', name: '学习', accent: '#6FB6C9' },
        { id: 'health', name: '健康', accent: '#5C8C77' }
      ];
    }
    if (!list.some(function (star) { return star.name === '全部'; })) {
      list.unshift({ id: 'all', name: '全部', accent: '#8C95A1' });
    }
    return list;
  }

  var themeStars = readStars();
  var defaultStar = themeStars.filter(function (star) { return star.name === '就业'; })[0] || themeStars[0];
  var activeStar = localStorage.getItem(ACTIVE_STAR_KEY) || defaultStar.name;
  if (!themeStars.some(function (star) { return star.name === activeStar; })) {
    activeStar = themeStars[0].name;
  }

  function activeTheme() {
    return themeStars.filter(function (star) { return star.name === activeStar; })[0] || themeStars[0];
  }

  function saveStars() {
    try { localStorage.setItem(STAR_KEY, JSON.stringify(themeStars)); } catch (e) {}
  }

  var themeBar = document.createElement('div');
  themeBar.className = 'xx-planet-themes';

  function renderThemeBar() {
    themeBar.innerHTML = '';
    themeStars.forEach(function (star) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'xx-planet-theme' + (star.name === activeStar ? ' on' : '');
      button.textContent = star.name;
      if (star.name === activeStar) button.style.background = star.accent || '#f2a0a0';
      button.addEventListener('click', function () {
        activeStar = star.name;
        try { localStorage.setItem(ACTIVE_STAR_KEY, activeStar); } catch (e) {}
        renderThemeBar();
        applyTheme();
      });
      themeBar.appendChild(button);
    });

    var add = document.createElement('button');
    add.type = 'button';
    add.className = 'xx-planet-theme xx-planet-theme-add';
    add.textContent = '＋';
    add.setAttribute('aria-label', '新建主题星体');
    add.addEventListener('click', function () {
      var name = (window.prompt('给新的主题星体起个名字', '新星体') || '').trim();
      if (!name) return;
      if (themeStars.some(function (star) { return star.name === name; })) return;
      var color = (window.prompt('输入基调色（HEX）', STAR_PALETTE[themeStars.length % STAR_PALETTE.length]) || '').trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) color = STAR_PALETTE[themeStars.length % STAR_PALETTE.length];
      themeStars.push({ id: 'star_' + Date.now(), name: name, accent: color });
      activeStar = name;
      saveStars();
      try { localStorage.setItem(ACTIVE_STAR_KEY, activeStar); } catch (e) {}
      renderThemeBar();
      applyTheme();
    });
    themeBar.appendChild(add);

    var ai = document.createElement('button');
    ai.type = 'button';
    ai.className = 'xx-planet-ai-toggle';
    ai.textContent = localStorage.getItem(AI_CLASSIFY_KEY) === '1' ? 'AI 归类 · 开' : 'AI 归类 · 关';
    ai.addEventListener('click', function () {
      var next = localStorage.getItem(AI_CLASSIFY_KEY) === '1' ? '0' : '1';
      try { localStorage.setItem(AI_CLASSIFY_KEY, next); } catch (e) {}
      ai.textContent = next === '1' ? 'AI 归类 · 开' : 'AI 归类 · 关';
    });
    themeBar.appendChild(ai);
  }

  function applyTheme() {
    var star = activeTheme();
    coreLabel.textContent = star.name;
    coreSub.textContent = '主题星体';
    var stops = svg.querySelectorAll('#xx-planet-core-gradient stop');
    if (stops.length >= 3) {
      stops[1].setAttribute('stop-color', star.accent || '#f2a0a0');
      stops[2].setAttribute('stop-color', star.accent || '#f2a0a0');
    }
  }

  function saveAssignment(node) {
    try {
      var all = JSON.parse(localStorage.getItem('xingxing_planet_assignments') || '{}');
      all[node.title] = node.themes.slice();
      localStorage.setItem('xingxing_planet_assignments', JSON.stringify(all));
    } catch (e) {}
  }

  function openAssignment(node) {
    var old = container.querySelector('.xx-planet-assign-sheet');
    if (old) old.remove();
    var sheet = document.createElement('div');
    sheet.className = 'xx-planet-assign-sheet';
    sheet.addEventListener('pointerdown', function (event) { event.stopPropagation(); });
    sheet.addEventListener('click', function (event) { event.stopPropagation(); });
    var head = document.createElement('div');
    head.className = 'assign-head';
    head.textContent = '归属星体 · ' + node.title;
    sheet.appendChild(head);
    var row = document.createElement('div');
    row.className = 'assign-row';
    themeStars.forEach(function (star) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'assign-chip' + (node.themes.indexOf(star.name) >= 0 ? ' on' : '');
      chip.textContent = star.name;
      chip.addEventListener('click', function () {
        var index = node.themes.indexOf(star.name);
        if (index >= 0) node.themes.splice(index, 1);
        else node.themes.push(star.name);
        if (!node.themes.length) node.themes.push(star.name);
        chip.classList.toggle('on', node.themes.indexOf(star.name) >= 0);
        saveAssignment(node);
      });
      row.appendChild(chip);
    });
    sheet.appendChild(row);
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'assign-close';
    close.textContent = '完成';
    close.addEventListener('click', function () { sheet.remove(); });
    sheet.appendChild(close);
    container.appendChild(sheet);
  }

  nodeRefs.forEach(function (ref) {
    ref.group.addEventListener('click', function (event) {
      event.stopPropagation();
      openAssignment(ref.node);
    });
  });

  container.appendChild(themeBar);
  themeBar.addEventListener('pointerdown', function (event) { event.stopPropagation(); });
  themeBar.addEventListener('click', function (event) { event.stopPropagation(); });
  renderThemeBar();
  applyTheme();

  var zoomBar = document.createElement('div');
  zoomBar.className = 'xx-planet-zoom';
  zoomBar.innerHTML = '<span>聚合</span><input type="range" min="0.18" max="1.18" step="0.01" value="1" aria-label="行星聚合缩放">';
  container.appendChild(zoomBar);
  zoomBar.addEventListener('pointerdown', function (event) { event.stopPropagation(); });
  zoomBar.addEventListener('click', function (event) { event.stopPropagation(); });
  var zoomInput = zoomBar.querySelector('input');

  function applyZoom(value) {
    zoom = Math.max(0.18, Math.min(1.18, Number(value) || 1));
    zoomInput.value = String(zoom);
  }

  zoomInput.addEventListener('input', function () { applyZoom(zoomInput.value); });
  container.addEventListener('wheel', function (event) {
    if (!event.deltaY) return;
    event.preventDefault();
    applyZoom(zoom + (event.deltaY < 0 ? 0.07 : -0.07));
  }, { passive: false });

  var pinch = null;
  container.addEventListener('touchstart', function (event) {
    if (event.touches.length !== 2) return;
    pinch = {
      distance: Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      ),
      zoom: zoom
    };
  }, { passive: true });
  container.addEventListener('touchmove', function (event) {
    if (!pinch || event.touches.length !== 2) return;
    event.preventDefault();
    var next = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY
    );
    applyZoom(pinch.zoom * (next / Math.max(1, pinch.distance)));
  }, { passive: false });
  container.addEventListener('touchend', function () { pinch = null; }, { passive: true });

  // 当前行星色放在根节点的 CSS 变量里，节点通过 CSS 类自动取色。
  var rotX = -4;
  var rotY = 0;
  var velocityX = 0;
  var velocityY = 0;
  var dragging = false;
  var moved = false;
  var lastX = 0;
  var lastY = 0;

  function updatePlanet() {
    if (!dragging) {
      rotY += .12 + velocityY;
      rotX += velocityX;
      rotX = Math.max(-68, Math.min(68, rotX));
      velocityY *= .94;
      velocityX *= .94;
      if (Math.abs(velocityY) < .008) velocityY = 0;
      if (Math.abs(velocityX) < .008) velocityX = 0;
    }

    var projected = nodes.map(function (node) {
      return {
        node: node,
        p: project(node, rotX * Math.PI / 180, rotY * Math.PI / 180),
        visible: activeStar === 'all' || node.themes.indexOf(activeStar) >= 0
      };
    });

    projected.forEach(function (item) {
      var node = item.node;
      var p = item.p;
      var ref = nodeRefs.filter(function (r) { return r.node === node; })[0];
      if (!ref) return;
      if (!item.visible) {
        ref.group.style.display = 'none';
        return;
      }
      ref.group.style.display = '';
      ref.group.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')');
      ref.group.style.opacity = (p.z < 0 ? .32 + p.depth * .30 : .62 + p.depth * .38).toFixed(2);
      ref.wash.setAttribute('r', (p.r * 1.42).toFixed(1));
      ref.body.setAttribute('r', p.r.toFixed(1));
      ref.shine.setAttribute('cx', (-p.r * .32).toFixed(1));
      ref.shine.setAttribute('cy', (-p.r * .34).toFixed(1));
      ref.shine.setAttribute('r', Math.max(2.8, p.r * .16).toFixed(1));

      var labelX, labelY, anchor;
      if (Math.abs(p.x - CX) < 64) {
        labelX = 0;
        labelY = p.y > CY ? p.r + 18 : -p.r - 9;
        anchor = 'middle';
      } else {
        labelX = p.x < CX ? -(p.r + 12) : (p.r + 12);
        labelY = 6;
        anchor = p.x < CX ? 'end' : 'start';
      }
      ref.label.setAttribute('x', labelX);
      ref.label.setAttribute('y', labelY);
      ref.label.setAttribute('text-anchor', anchor);
      if (ref.group.parentNode !== (p.z < 0 ? backLayer : frontLayer)) {
        (p.z < 0 ? backLayer : frontLayer).appendChild(ref.group);
      }
    });

    edgeRefs.forEach(function (ref) {
      var a = projected.filter(function (item) { return item.node === ref.node; })[0];
      var b = projected.filter(function (item) { return item.node === ref.next; })[0];
      if (!a || !b) return;
      if (!a.visible || !b.visible) {
        ref.center.style.display = 'none';
        ref.neighbor.style.display = 'none';
        return;
      }
      ref.center.style.display = '';
      ref.neighbor.style.display = '';
      ref.center.setAttribute('x2', a.p.x.toFixed(1));
      ref.center.setAttribute('y2', a.p.y.toFixed(1));
      ref.center.setAttribute('opacity', (.12 + a.p.depth * .38).toFixed(2));
      ref.neighbor.setAttribute('x1', a.p.x.toFixed(1));
      ref.neighbor.setAttribute('y1', a.p.y.toFixed(1));
      ref.neighbor.setAttribute('x2', b.p.x.toFixed(1));
      ref.neighbor.setAttribute('y2', b.p.y.toFixed(1));
      ref.neighbor.setAttribute('opacity', (.08 + Math.min(a.p.depth, b.p.depth) * .24).toFixed(2));
    });

    requestAnimationFrame(updatePlanet);
  }

  container.addEventListener('pointerdown', function (event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    moved = false;
    lastX = event.clientX;
    lastY = event.clientY;
    velocityX = 0;
    velocityY = 0;
    container.classList.add('is-dragging');
    try { container.setPointerCapture(event.pointerId); } catch (e) {}
    event.preventDefault();
  });

  container.addEventListener('pointermove', function (event) {
    if (!dragging) return;
    var dx = event.clientX - lastX;
    var dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    lastX = event.clientX;
    lastY = event.clientY;
    rotY += dx * .55;
    rotX -= dy * .42;
    rotX = Math.max(-68, Math.min(68, rotX));
    velocityY = dx * .018;
    velocityX = -dy * .012;
    event.preventDefault();
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    container.classList.remove('is-dragging');
    try { container.releasePointerCapture(event.pointerId); } catch (e) {}
  }
  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', endDrag);
  container.addEventListener('click', function (event) {
    if (moved) {
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    }
  }, true);

  requestAnimationFrame(updatePlanet);
})();
