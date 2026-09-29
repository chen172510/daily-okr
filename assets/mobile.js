/* 手机端底部导航：除了自带 tabbar 的页面，其余页面自动补一条 */
(function () {
  'use strict';
  if (window.innerWidth > 900) return;
  if (document.querySelector('.xx-mobile-nav')) return;
  if (document.querySelector('.mobile-tabbar')) return;   // 首页已有自己的底部栏

  var ITEMS = [
    ['dashboard.html', '⌂', '今日行醒'],
    ['okrs.html', '◎', '目标'],
    ['review.html', '✎', '复盘'],
    ['daily-plan.html', '☑', '计划'],
    ['error-book.html', '☰', '练习本']
  ];

  function build() {
    var here = location.pathname.split('/').pop() || 'dashboard.html';
    var nav = document.createElement('nav');
    nav.className = 'xx-mobile-nav';
    nav.innerHTML = ITEMS.map(function (it) {
      var on = it[0] === here ? ' class="on"' : '';
      return '<a href="' + it[0] + '"' + on + '><i>' + it[1] + '</i>' + it[2] + '</a>';
    }).join('');
    document.body.appendChild(nav);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
