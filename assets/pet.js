/* ============================================
   行醒 · 桌宠「周星星」
   使用 assets/pet-zhouxingxing.jpg 作为形象，
   按 状态 / 精力 / 精神 给一点状态表现。
   ============================================ */
(function (global) {
  'use strict';

  var IMG = '../assets/pet-zhouxingxing.jpg';

  function num(fn, dft) { try { var v = fn(); return typeof v === 'number' && !isNaN(v) ? v : dft; } catch (e) { return dft; } }
  function stat() {
    var A = global.XingxingCommon;
    if (!A) return { s: 75, e: 80, m: 80 };
    return { s: num(A.getState, 75), e: num(A.getEnergy, 80), m: num(A.getMental, 80) };
  }

  function moodText(v) {
    if (v.s <= 10) return '有点没精神…';
    if (v.e <= 25) return '困到不行 zZ';
    if (v.m <= 30) return '心里有点沉';
    if (v.e >= 70 && v.e <= 80) return '想逗你一下';
    if (v.m >= 90) return '心情不错，翻本书';
    return '安静待着';
  }

  function html() {
    var v = stat();
    var filter = 'none';
    if (v.s <= 10) filter = 'grayscale(0.7)';
    else if (v.e <= 25) filter = 'brightness(0.85)';
    else if (v.m >= 90) filter = 'saturate(1.15)';
    var zz = v.e <= 25 ? '<span style="position:absolute;top:4%;right:6%;font:bold 16px sans-serif;color:#5b7fd6;">zZ</span>' : '';
    return '<div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">'
      + '<img src="' + IMG + '" alt="周星星" style="width:100%;height:100%;object-fit:contain;filter:' + filter + ';border-radius:10px;" />'
      + zz
      + '</div>';
  }

  function mount(sel) {
    var el = document.querySelector(sel || '#petAvatar');
    if (!el) return false;
    el.innerHTML = html();
    el.style.background = 'none';
    el.title = '周星星 · ' + moodText(stat());
    return true;
  }

  function init() {
    mount('#petAvatar');
    setInterval(function () { mount('#petAvatar'); }, 60000);
  }

  global.XingxingPet = { mount: mount, html: html, svg: html, moodText: moodText };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
