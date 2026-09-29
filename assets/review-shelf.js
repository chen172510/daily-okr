/* ============================================
   复盘页 · 手机版「书柜」布局
   便利贴看状态 → 从书柜拿书 → 只看那一块内容 → 返回书柜
   宽屏（>900px）不启用，保持原来的长页布局
   ============================================ */
(function () {
  'use strict';
  if (window.innerWidth > 900) return;

  var BOOKS = [
    { key: 'action',  icon: '📖', name: '今日行动', desc: '今天做了什么' },
    { key: 'graph',   icon: '🕸️', name: '事务脉络', desc: '因果与关联' },
    { key: 'diary',   icon: '📓', name: '备忘录',   desc: '三省与问题' },
    { key: 'wins',    icon: '🏅', name: '小胜利',   desc: '今天赢在哪' },
    { key: 'habits',  icon: '🔁', name: '习惯打卡', desc: '连续多少天' },
    { key: 'history', icon: '📅', name: '往昔省身', desc: '翻翻以前' }
  ];

  function pick(sel) { return document.querySelector(sel); }

  function build() {
    var cards = Array.prototype.slice.call(
      document.querySelectorAll('.stats-row, .graph-card, .questions-card, .history-card')
    ).filter(function (el) { return el.id !== 'autoArchiveCard' || true; });
    if (!cards.length) return;

    // 给每块内容编号，方便定位
    cards.forEach(function (el, i) { el.setAttribute('data-xx-block', String(i)); });

    function findBlock(pred) {
      for (var i = 0; i < cards.length; i++) if (pred(cards[i])) return cards[i];
      return null;
    }
    var byId = function (id) { return findBlock(function (el) { return el.id === id; }); };
    var byTitle = function (t) {
      return findBlock(function (el) {
        var h = el.querySelector('.card-title, .section-title');
        return h && h.textContent.indexOf(t) > -1;
      });
    };

    var map = {
      action: byId('autoArchiveCard') || byTitle('今天的行动'),
      graph: byTitle('事务脉络'),
      diary: byTitle('我的日记') || byTitle('三省') || byTitle('备忘录'),
      wins: byId('winsCard') || byTitle('今日小胜利'),
      habits: byId('habitsCard') || byTitle('习惯打卡'),
      history: byTitle('往昔') || findBlock(function (el) { return el.className.indexOf('history-card') > -1; })
    };

    // ---------- 便利贴数据 ----------
    var T = window.XingxingTasks;
    var stats = T ? T.stats() : { total: 0, done: 0, actualMinutes: 0 };
    var rate = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
    var day = T ? T.dayWindow() : null;
    var moodEl = pick('.stat-big-emoji');
    var moodTxtEl = pick('.stat-sub-text');
    var mood = moodEl ? (moodEl.textContent || '').trim() : '';
    var moodTxt = moodTxtEl ? (moodTxtEl.textContent || '').trim() : '';
    var fmtMin = T ? T.fmtMinutes(stats.actualMinutes) : (stats.actualMinutes + ' 分钟');
    var range = day && day.first
      ? (T.minutesToText(day.start) + ' – ' + T.minutesToText(day.end))
      : '还没记录';

    // ---------- 挂历 ----------
    function calendar() {
      var now = new Date();
      var y = now.getFullYear(), m = now.getMonth();
      var first = new Date(y, m, 1);
      var days = new Date(y, m + 1, 0).getDate();
      var lead = (first.getDay() + 6) % 7;   // 周一开头
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
        var cls = 'cal-day' + (hasReview[ds] ? ' has' : '') + (ds === todayStr ? ' today' : '');
        cells += '<span class="' + cls + '" data-date="' + ds + '">' + d + '</span>';
      }
      return '<div class="shelf-cal">'
        + '<div class="shelf-cal-head">' + y + ' 年 ' + (m + 1) + ' 月'
        + '<span class="shelf-cal-hint">有记录的日子会有小点</span></div>'
        + '<div class="shelf-cal-week"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>'
        + '<div class="shelf-cal-grid">' + cells + '</div>'
        + '</div>';
    }

    var notes = ''
      + '<div class="shelf-notes">'
      + '<div class="note note-a"><b>' + rate + '%</b><span>今日完成</span></div>'
      + '<div class="note note-b"><b>' + (mood || '—') + '</b><span>' + (moodTxt || '今日心境') + '</span></div>'
      + '<div class="note note-c"><b>' + fmtMin + '</b><span>实际投入</span></div>'
      + '<div class="note note-d"><b>' + range + '</b><span>修行区间</span></div>'
      + '</div>';

    var books = '<div class="shelf-books">' + BOOKS.map(function (b) {
      var on = map[b.key] ? '' : ' disabled';
      return '<button class="shelf-book' + on + '" data-book="' + b.key + '">'
        + '<span class="book-icon">' + b.icon + '</span>'
        + '<span class="book-name">' + b.name + '</span>'
        + '<span class="book-desc">' + b.desc + '</span></button>';
    }).join('') + '</div>';

    var shelf = document.createElement('div');
    shelf.className = 'xx-shelf';
    shelf.id = 'xxShelf';
    shelf.innerHTML = notes
      + '<div class="shelf-title">我的复盘书架</div>'
      + books
      + calendar()
      + '<div class="shelf-tip">点一本书，只看那一部分，不用一直往下滑</div>';

    var host = pick('main.main-content') || pick('.content-area') || document.body;
    host.insertBefore(shelf, host.firstChild);

    // ---------- 聚焦模式 ----------
    var bar = document.createElement('div');
    bar.className = 'xx-focus-bar';
    bar.innerHTML = '<button class="xx-back">‹ 书架</button><span class="xx-focus-title"></span>';
    document.body.appendChild(bar);

    function exitFocus() {
      document.body.classList.remove('xx-focus');
      cards.forEach(function (el) { el.style.display = ''; });
      bar.classList.remove('on');
      window.scrollTo(0, 0);
    }

    function enterFocus(key) {
      var el = map[key];
      if (!el) return;
      cards.forEach(function (c) { c.style.display = (c === el ? '' : 'none'); });
      var titleEl = bar.querySelector('.xx-focus-title');
      var b = BOOKS.filter(function (x) { return x.key === key; })[0];
      if (titleEl && b) titleEl.textContent = b.icon + ' ' + b.name;
      document.body.classList.add('xx-focus');
      bar.classList.add('on');
      window.scrollTo(0, 0);
    }

    shelf.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-book]') : null;
      if (btn) { enterFocus(btn.getAttribute('data-book')); return; }
      var day = e.target.closest ? e.target.closest('[data-date]') : null;
      if (day) {
        var ds = day.getAttribute('data-date');
        var cell = document.querySelector('#reviewCalendar .cal-cell[data-date="' + ds + '"]')
          || document.querySelector('.cal-cell[data-date="' + ds + '"]');
        if (cell) cell.click();
        enterFocus('history');
      }
    });
    bar.querySelector('.xx-back').addEventListener('click', exitFocus);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(build, 900); });
  else setTimeout(build, 900);
})();
