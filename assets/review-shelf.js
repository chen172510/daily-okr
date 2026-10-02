/* ============================================
   复盘页 · 手机版「书架 → 专属页面」
   书架点一本书，打开那一件事的全屏专属页（自带标题栏和返回），
   不再是把原来的长页面往下滑。
   宽屏（>900px）不启用，保持原来的长页布局。
   ============================================ */
(function () {
  'use strict';
  if (!window.xxIsMobileView || !window.xxIsMobileView()) return;

  var ICONS = {
    action:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#c98a6e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>',
    graph:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#c98a6e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>',
    diary:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#c98a6e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>',
    wins:    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#c98a6e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    habits:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#c98a6e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    history: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#c98a6e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>'
  };

  var BOOKS = [
    { key: 'action',  icon: ICONS.action,  name: '今日行动', desc: '今天做了什么' },
    { key: 'graph',   icon: ICONS.graph,   name: '事务脉络', desc: '因果与关联' },
    { key: 'diary',   icon: ICONS.diary,   name: '备忘录',   desc: '三省与问题' },
    { key: 'wins',    icon: ICONS.wins,    name: '小胜利',   desc: '今天赢在哪' },
    { key: 'habits',  icon: ICONS.habits,  name: '习惯打卡', desc: '连续多少天' },
    { key: 'history', icon: ICONS.history, name: '往昔省身', desc: '翻翻以前' }
  ];

  var STATUS = {
    done:    { text: '已圆满', cls: 'st-done' },
    doing:   { text: '修行中', cls: 'st-doing' },
    blocked: { text: '有阻碍', cls: 'st-blocked' },
    todo:    { text: '未开始', cls: 'st-todo' }
  };

  function pick(sel) { return document.querySelector(sel); }

  function build() {
    var cards = Array.prototype.slice.call(
      document.querySelectorAll('.stats-row, .graph-card, .questions-card, .history-card')
    );
    if (!cards.length) return;

    function find(pred) {
      for (var i = 0; i < cards.length; i++) if (pred(cards[i])) return cards[i];
      return null;
    }
    function byId(id) { return find(function (el) { return el.id === id; }); }
    function byTitle(t) {
      return find(function (el) {
        var h = el.querySelector('.card-title, .section-title');
        return h && h.textContent.replace(/\s/g, '').indexOf(t) > -1;
      });
    }

    var map = {
      graph: byTitle('事务脉络'),
      diary: byTitle('我的日记') || byTitle('三省') || byTitle('备忘录'),
      wins: byId('winsCard') || byTitle('今日小胜利'),
      habits: byId('habitsCard') || byTitle('习惯打卡'),
      history: byTitle('往昔') || find(function (el) { return el.className.indexOf('history-card') > -1; })
    };

    // 便利贴的数值：单独抽成函数，方便稍后再刷新一次（页面脚本可能后渲染）
    function noteValues() {
      var TX = window.XingxingTasks;
      var s = TX ? TX.stats() : { total: 0, done: 0, doing: 0, blocked: 0, todo: 0, actualMinutes: 0, tasks: [] };
      var d = TX ? TX.dayWindow() : null;
      var moodE = pick('.stat-big-emoji');
      var moodT = pick('.stat-sub-text');
      return {
        rate: s.total ? Math.round((s.done / s.total) * 100) : 0,
        mood: moodE ? (moodE.textContent || '').trim() : '',
        moodTxt: moodT ? (moodT.textContent || '').trim() : '',
        fmtMin: TX ? TX.fmtMinutes(s.actualMinutes) : (s.actualMinutes + ' 分钟'),
        range: (d && d.first) ? (TX.minutesToText(d.start) + ' – ' + TX.minutesToText(d.end)) : '还没记录'
      };
    }
    var nv = noteValues();
    var stats = window.XingxingTasks ? window.XingxingTasks.stats() : { total: 0 };
    var rate = nv.rate, mood = nv.mood, moodTxt = nv.moodTxt, fmtMin = nv.fmtMin, range = nv.range;

    /* ---------------- 便利贴 + 书柜 + 挂历 ---------------- */
    function calendar() {
      var now = new Date();
      var y = now.getFullYear(), m = now.getMonth();
      var days = new Date(y, m + 1, 0).getDate();
      var lead = (new Date(y, m, 1).getDay() + 6) % 7;
      var hasReview = {};
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('xingxing_review_') === 0) hasReview[k.replace('xingxing_review_', '')] = 1;
        }
      } catch (e) {}
      var todayStr = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      var cells = '';
      for (var b = 0; b < lead; b++) cells += '<span class="cal-blank"></span>';
      for (var d = 1; d <= days; d++) {
        var ds = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        cells += '<span class="cal-day' + (hasReview[ds] ? ' has' : '') + (ds === todayStr ? ' today' : '')
          + '" data-date="' + ds + '">' + d + '</span>';
      }
      return '<div class="shelf-cal">'
        + '<div class="shelf-cal-head">' + y + ' 年 ' + (m + 1) + ' 月'
        + '<span class="shelf-cal-hint">有记录的日子有小点</span></div>'
        + '<div class="shelf-cal-week"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>'
        + '<div class="shelf-cal-grid">' + cells + '</div></div>';
    }

    var shelf = document.createElement('div');
    shelf.className = 'xx-shelf';
    shelf.id = 'xxShelf';
    shelf.innerHTML =
        '<div class="shelf-notes">'
      +   '<div class="note note-a"><b>' + rate + '%</b><span>今日完成</span></div>'
      +   '<div class="note note-b"><b>' + (mood || '—') + '</b><span>' + (moodTxt || '今日心境') + '</span></div>'
      +   '<div class="note note-c"><b>' + fmtMin + '</b><span>实际投入</span></div>'
      +   '<div class="note note-d"><b>' + range + '</b><span>修行区间</span></div>'
      + '</div>'
      + '<div class="shelf-title">我的复盘书架</div>'
      + '<div class="shelf-books">' + BOOKS.map(function (b) {
          return '<button class="shelf-book" data-book="' + b.key + '">'
            + '<span class="book-icon">' + b.icon + '</span>'
            + '<span class="book-name">' + b.name + '</span>'
            + '<span class="book-desc">' + b.desc + '</span></button>';
        }).join('') + '</div>'
      + '<div class="shelf-tip">点一本书，进入那一件事的专属页面</div>';

    // 放在顶栏（时间/天气/太阳月亮）下面，顶栏保持最上面
    var topbar = pick('header.topbar') || pick('.topbar');
    var host = pick('main.main-content') || pick('.content-area') || document.body;
    if (topbar && topbar.parentNode) topbar.insertAdjacentElement('afterend', shelf);
    else host.insertBefore(shelf, host.firstChild);

    // 手机端：原来的长内容默认收起，只通过书架进入
    cards.forEach(function (el) { el.setAttribute('data-xx-block', '1'); });
    // 主内容区里除了顶栏 / 页头 / 书架，其余整块也收起，
    // 避免出现"书架下面还挂着旧内容"的情况（比如问题速记那块）
    var mainEl = pick('main.main-content') || pick('.content-area') || host;
    if (mainEl && mainEl.children) {
      Array.prototype.forEach.call(mainEl.children, function (el) {
        if (el === shelf) return;
        if (el.tagName === 'HEADER') return;
        if (el.classList && (el.classList.contains('topbar') || el.classList.contains('page-header'))) return;
        el.setAttribute('data-xx-block', '1');
      });
    }
    document.body.classList.add('xx-mobile-ready');

    /* ---------------- 全屏专属页 ---------------- */
    var sheet = document.createElement('div');
    sheet.className = 'xx-sheet';
    sheet.id = 'xxSheet';
    sheet.innerHTML = '<div class="xx-sheet-head">'
      + '<button class="xx-sheet-back" type="button">‹ 书架</button>'
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

    function renderAction() {
      var T = window.XingxingTasks;
      var chips = '<div class="sheet-chips">'
        + '<span class="chip">计划 ' + stats.total + '</span>'
        + '<span class="chip st-done">已圆满 ' + (stats.done || 0) + '</span>'
        + '<span class="chip st-doing">修行中 ' + (stats.doing || 0) + '</span>'
        + '<span class="chip st-blocked">有阻碍 ' + (stats.blocked || 0) + '</span>'
        + '<span class="chip">未开始 ' + (stats.todo || 0) + '</span>'
        + '<span class="chip">实际 ' + fmtMin + '</span></div>';

      if (!stats.tasks || !stats.tasks.length) {
        return chips + '<div class="sheet-empty">今天还没排计划。<br>去「每日计划」排一段，这里就会有记录。</div>';
      }

      var rows = stats.tasks.map(function (t) {
        var st = STATUS[t.effective] || STATUS.todo;
        return '<div class="sheet-card ' + st.cls + '">'
          + '<div class="sc-top"><span class="sc-name">' + t.name + '</span>'
          + '<span class="sc-status ' + st.cls + '">' + st.text + '</span></div>'
          + '<div class="sc-meta">' + t.startTime + ' – ' + t.endTime
          + (t.actualMinutes ? '　实际 ' + (T ? T.fmtMinutes(t.actualMinutes) : t.actualMinutes + ' 分钟') : '')
          + '</div>'
          + (t.okrId ? '<div class="sc-goal">🎯 ' + (t.krTitle ? t.krTitle + ' · ' : '') + (T.okrTitle(t.okrId) || '已关联目标') + '</div>' : '')
          + (t.blockedReason ? '<div class="sc-reason">阻碍：' + t.blockedReason + '</div>' : '')
          + '</div>';
      }).join('');

      return chips + '<div class="sheet-list">' + rows + '</div>';
    }

    function openBook(key) {
      var book = BOOKS.filter(function (b) { return b.key === key; })[0];
      if (!book) return;
      restoreMoved();
      sheetBody.innerHTML = '';
      sheetTitle.innerHTML = book.icon + '<span>' + book.name + '</span>';

      if (key === 'action') {
        sheetBody.innerHTML = renderAction();
      } else {
        var el = map[key];
        if (!el) {
          sheetBody.innerHTML = '<div class="sheet-empty">这块内容还没有。<br>先去记录一点吧。</div>';
        } else {
          moved = { el: el, parent: el.parentNode, next: el.nextSibling };
          sheetBody.appendChild(el);
        }
      }
      document.body.classList.add('xx-sheet-open');
      sheetBody.scrollTop = 0;
    }

    function closeSheet() {
      document.body.classList.remove('xx-sheet-open');
      restoreMoved();
      sheetBody.innerHTML = '';
    }

    shelf.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-book]') : null;
      if (btn) { openBook(btn.getAttribute('data-book')); return; }
      var dayEl = e.target.closest ? e.target.closest('[data-date]') : null;
      if (dayEl) {
        var ds = dayEl.getAttribute('data-date');
        openBook('history');
        setTimeout(function () {
          var cell = sheetBody.querySelector('.cal-cell[data-date="' + ds + '"]')
            || document.querySelector('.cal-cell[data-date="' + ds + '"]');
          if (cell) cell.click();
        }, 350);
      }
    });

    sheet.querySelector('.xx-sheet-back').addEventListener('click', closeSheet);

    // 页面自己的脚本可能稍后才把数字渲染好：过 1.2 秒再刷一次便利贴
    setTimeout(function () {
      var v = noteValues();
      var notes = shelf.querySelectorAll('.shelf-notes .note b');
      if (notes.length >= 4) {
        notes[0].textContent = v.rate + '%';
        notes[1].textContent = v.mood || '—';
        notes[2].textContent = v.fmtMin;
        notes[3].textContent = v.range;
      }
      var subs = shelf.querySelectorAll('.shelf-notes .note span');
      if (subs.length >= 2 && v.moodTxt) subs[1].textContent = v.moodTxt;
    }, 1200);
  }

  // 立刻搭书架（不等延迟），避免先闪一下原来的长页面
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
