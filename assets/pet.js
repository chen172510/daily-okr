/* ============================================
   行醒 · 桌宠「周星星」
   本体 = assets/pet-zhouxingxing.jpg（你提供的人物图）
   在这张图之上叠加配件（墨镜 / 眼罩 / 帽子 / 可乐 / 书…），
   按 状态 / 精力 / 精神 分档随机出现。点一下换个搭配。
   ============================================ */
(function (global) {
  'use strict';

  var IMG = '../assets/pet-zhouxingxing.jpg';
  var RATIO = '1358 / 1280';
  var INK = '#141414';

  // 配件：位置以图片为坐标（百分比），按参考图构图校准
  var PROPS = {
    // 侧脸朝右 → 单片墨镜 + 镜腿
    sunglasses: {
      left: '46%', top: '32%', width: '20%',
      svg: '<svg viewBox="0 0 64 26"><rect x="6" y="4" width="26" height="17" rx="7" fill="' + INK + '"/><path d="M32 11 h26" stroke="' + INK + '" stroke-width="3.4"/></svg>'
    },
    blindfold: {
      left: '36%', top: '30%', width: '34%',
      svg: '<svg viewBox="0 0 80 24"><path d="M2 13 q38 -10 76 0" stroke="' + INK + '" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M2 13 q38 -10 76 0" stroke="#5a5a5a" stroke-width="1.6" fill="none"/></svg>'
    },
    party: {
      left: '36%', top: '1%', width: '22%',
      svg: '<svg viewBox="0 0 60 60"><path d="M30 6 L48 54 L12 54 Z" fill="#e0483a"/><circle cx="30" cy="6" r="6" fill="#f5c518"/><circle cx="22" cy="42" r="3" fill="#fff"/><circle cx="38" cy="44" r="3" fill="#7fd1ff"/></svg>'
    },
    nightcap: {
      left: '26%', top: '0%', width: '42%',
      svg: '<svg viewBox="0 0 100 60"><path d="M4 44 q34 -50 92 -6 q-20 -6 -46 -3 q-26 -3 -46 9 Z" fill="#3b4fa8"/><circle cx="92" cy="34" r="7" fill="#fff"/></svg>'
    },
    cat: {
      left: '28%', top: '1%', width: '44%',
      svg: '<svg viewBox="0 0 100 50"><path d="M14 44 L8 6 L40 30 Z" fill="' + INK + '"/><path d="M86 44 L92 6 L60 30 Z" fill="' + INK + '"/><path d="M40 30 L30 20 L44 22 Z" fill="#e9a0b4"/><path d="M60 30 L70 20 L56 22 Z" fill="#e9a0b4"/></svg>'
    },
    cola: {
      left: '68%', top: '60%', width: '16%',
      svg: '<svg viewBox="0 0 40 70"><rect x="6" y="8" width="28" height="54" rx="8" fill="#c0392b"/><rect x="6" y="26" width="28" height="16" fill="#fff"/><rect x="10" y="2" width="20" height="8" rx="3" fill="#8a8a8a"/><text x="20" y="38" font-size="10" text-anchor="middle" fill="#c0392b" font-family="sans-serif">可乐</text></svg>'
    },
    book: {
      left: '2%', top: '60%', width: '28%',
      svg: '<svg viewBox="0 0 80 50"><path d="M4 26 q36 -16 72 0 q-36 14 -72 0 Z" fill="#fff" stroke="' + INK + '" stroke-width="3"/><path d="M40 25 l0 14" stroke="' + INK + '" stroke-width="2.4"/><path d="M12 26 q28 -9 56 0" stroke="#9a9a9a" stroke-width="1.4" fill="none"/></svg>'
    },
    tea: {
      left: '14%', top: '58%', width: '18%',
      svg: '<svg viewBox="0 0 60 60"><path d="M10 34 h32 l-4 22 h-24 Z" fill="#fff" stroke="' + INK + '" stroke-width="3"/><path d="M42 38 q10 2 0 12" stroke="' + INK + '" stroke-width="3" fill="none"/><path d="M20 28 q6 -8 0 -14 M32 28 q6 -8 0 -14" stroke="' + INK + '" stroke-width="2.4" fill="none"/></svg>'
    },
    sword: {
      left: '66%', top: '18%', width: '20%',
      svg: '<svg viewBox="0 0 40 80"><path d="M20 4 L20 62" stroke="' + INK + '" stroke-width="6"/><path d="M8 62 L32 62" stroke="' + INK + '" stroke-width="5"/><path d="M14 62 L14 78 M26 62 L26 78" stroke="' + INK + '" stroke-width="4"/></svg>'
    }
  };

  function num(fn, dft) { try { var v = fn(); return typeof v === 'number' && !isNaN(v) ? v : dft; } catch (e) { return dft; } }
  function stat() {
    var A = global.XingxingCommon;
    if (!A) return { s: 75, e: 80, m: 80 };
    return { s: num(A.getState, 75), e: num(A.getEnergy, 80), m: num(A.getMental, 80) };
  }
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

  function combo() {
    var v = stat(), r = Math.random();
    var list = [];
    if (v.e <= 25) list.push('nightcap');
    else if (v.m <= 30) list.push('blindfold');
    else if (r < 0.4) list.push('sunglasses');
    else if (r < 0.55) list.push('blindfold');
    if (r > 0.72) list.push('cola');
    if (v.m >= 90 || r < 0.2) list.push('book');
    if (v.s >= 70 && v.s <= 90 && r < 0.3) list.push('party');
    if (r > 0.9) list.push('cat');
    if (r > 0.5 && r < 0.6) list.push('tea');
    if (v.s >= 70 && v.e >= 70 && r > 0.8) list.push('sword');
    if (!list.length) list.push(pick(['sunglasses', 'book', 'cola']));
    return list;
  }

  function html() {
    var overlays = combo().map(function (k) {
      var p = PROPS[k];
      if (!p) return '';
      return '<div style="position:absolute;left:' + p.left + ';top:' + p.top + ';width:' + p.width + ';">' + p.svg + '</div>';
    }).join('');
    return '<div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">'
      + '<div style="position:relative;height:100%;max-width:100%;aspect-ratio:' + RATIO + ';">'
      +   '<img src="' + IMG + '" alt="周星星" style="width:100%;height:100%;display:block;" />'
      +   overlays
      + '</div></div>';
  }

  function mount(sel) {
    var el = document.querySelector(sel || '#petAvatar');
    if (!el) return false;
    el.innerHTML = html();
    el.style.background = 'none';
    el.style.cursor = 'pointer';
    el.title = '周星星 · 点我换个搭配';
    if (!el.getAttribute('data-xx-pet')) {
      el.setAttribute('data-xx-pet', '1');
      el.addEventListener('click', function (e) { e.stopPropagation(); el.innerHTML = html(); });
    }
    return true;
  }

  function init() {
    mount('#petAvatar');
    setInterval(function () { mount('#petAvatar'); }, 60000);
  }

  global.XingxingPet = { mount: mount, html: html, svg: html, combo: combo, PROPS: PROPS };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
