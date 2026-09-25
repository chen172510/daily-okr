/* ============================================
   行醒 · 桌宠「周星星」
   原创 SVG 黄圆脸：按 状态 / 精力 / 精神 换表情与换装，档位内随机。
   ============================================ */
(function (global) {
  'use strict';

  function num(fn, dft) { try { var v = fn(); return typeof v === 'number' ? v : dft; } catch (e) { return dft; } }
  function stat() {
    var A = global.XingxingCommon;
    if (!A) return { s: 75, e: 80, m: 80 };
    return {
      s: num(A.getState, 75),
      e: num(A.getEnergy, 80),
      m: num(A.getMental, 80)
    };
  }

  var COSTUMES = ['party', 'pirate', 'vampire', 'helmet'];
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  // 依据三档数值挑「表情 + 配件」；档位内随机
  function mood() {
    var v = stat();
    var r = Math.random();
    if (v.s <= 10) return { face: 'blank' };
    if (v.e <= 25) return { face: 'sleepy' };
    if (v.m <= 30) return { face: 'cry' };
    if (v.e >= 70 && v.e <= 80) return { face: pick(['tease', 'wink', 'smug']) };
    if (v.s >= 70 && v.s <= 90) return { face: pick(['happy', 'giggle']), costume: pick(COSTUMES) };
    if (v.m >= 90) return { face: 'sunglasses' };
    return { face: pick(['normal', 'happy', 'wink']), costume: r < 0.35 ? pick(COSTUMES) : null };
  }

  function eyes(kind) {
    var L = 68, R = 132, Y = 92;
    function eye(cx, ry, r) {
      return '<ellipse cx="' + cx + '" cy="' + Y + '" rx="' + r + '" ry="' + ry + '" fill="#fff"/>'
        + '<circle cx="' + cx + '" cy="' + Y + '" r="' + (r * 0.62) + '" fill="#1a1a1a"/>';
    }
    switch (kind) {
      case 'blank':
        return '<rect x="52" y="88" width="34" height="8" rx="4" fill="#1a1a1a"/>'
          + '<rect x="114" y="88" width="34" height="8" rx="4" fill="#1a1a1a"/>';
      case 'sleepy':
        return '<path d="M52 92 q17 -14 34 0" stroke="#1a1a1a" stroke-width="7" fill="none" stroke-linecap="round"/>'
          + '<path d="M114 92 q17 -14 34 0" stroke="#1a1a1a" stroke-width="7" fill="none" stroke-linecap="round"/>'
          + '<text x="150" y="52" font-size="26" fill="#5b7fd6" font-family="sans-serif">z</text>'
          + '<text x="164" y="38" font-size="18" fill="#8aa6e8" font-family="sans-serif">z</text>';
      case 'cry':
        return eye(L, 22, 20) + eye(R, 22, 20)
          + '<ellipse cx="56" cy="126" rx="6" ry="10" fill="#63c6f5"/>'
          + '<ellipse cx="146" cy="120" rx="6" ry="10" fill="#63c6f5"/>';
      case 'tease':
        return eye(L, 16, 22)
          + '<path d="M112 92 q18 -12 38 0" stroke="#1a1a1a" stroke-width="7" fill="none" stroke-linecap="round"/>';
      case 'wink':
        return eyes('tease');
      case 'smug':
        return '<path d="M52 88 q18 14 36 0" stroke="#1a1a1a" stroke-width="7" fill="none" stroke-linecap="round"/>'
          + eye(R, 16, 22);
      case 'giggle':
        return '<path d="M54 94 q16 -18 32 0" stroke="#1a1a1a" stroke-width="7" fill="none" stroke-linecap="round"/>'
          + '<path d="M114 94 q16 -18 32 0" stroke="#1a1a1a" stroke-width="7" fill="none" stroke-linecap="round"/>';
      case 'sunglasses':
        return '<rect x="42" y="80" width="52" height="30" rx="8" fill="#1a1a1a"/>'
          + '<rect x="106" y="80" width="52" height="30" rx="8" fill="#1a1a1a"/>'
          + '<rect x="92" y="90" width="16" height="8" fill="#1a1a1a"/>';
      case 'happy':
        return '<path d="M54 94 q16 -18 32 0" stroke="#1a1a1a" stroke-width="7" fill="none" stroke-linecap="round"/>'
          + '<path d="M114 94 q16 -18 32 0" stroke="#1a1a1a" stroke-width="7" fill="none" stroke-linecap="round"/>';
      default:
        return eye(L, 20, 20) + eye(R, 20, 20);
    }
  }

  function mouth(kind) {
    switch (kind) {
      case 'blank': return '<rect x="92" y="132" width="16" height="6" rx="3" fill="#1a1a1a"/>';
      case 'cry': return '<ellipse cx="100" cy="138" rx="12" ry="16" fill="#1a1a1a"/>';
      case 'sleepy': return '<ellipse cx="100" cy="136" rx="9" ry="12" fill="#1a1a1a"/>';
      case 'happy':
      case 'giggle': return '<path d="M74 128 q26 30 52 0" stroke="#1a1a1a" stroke-width="7" fill="none" stroke-linecap="round"/>';
      case 'smug': return '<path d="M82 134 q18 10 36 -4" stroke="#1a1a1a" stroke-width="6" fill="none" stroke-linecap="round"/>';
      case 'tease':
      case 'wink': return '<circle cx="100" cy="134" r="7" fill="#1a1a1a"/>';
      default: return '<circle cx="100" cy="134" r="6" fill="#1a1a1a"/>';
    }
  }

  function costume(kind) {
    switch (kind) {
      case 'party':
        return '<path d="M100 8 L128 54 L72 54 Z" fill="#e0483a"/>'
          + '<circle cx="100" cy="8" r="7" fill="#f5c518"/>'
          + '<circle cx="86" cy="44" r="4" fill="#fff"/><circle cx="112" cy="46" r="4" fill="#7fd1ff"/>';
      case 'pirate':
        return '<path d="M14 96 q86 -60 172 0 q-86 -18 -172 0 Z" fill="#e0483a"/>'
          + '<circle cx="132" cy="94" r="20" fill="#1a1a1a"/>'
          + '<path d="M120 94 l24 0 M132 84 l0 22" stroke="#fff" stroke-width="4"/>'
          + '<path d="M18 96 q82 -26 164 0" stroke="#1a1a1a" stroke-width="3" fill="none"/>';
      case 'vampire':
        return '<path d="M12 150 q88 -46 176 0 l0 50 l-176 0 Z" fill="#7d1a1a" opacity="0.9"/>'
          + '<path d="M12 150 q88 -34 176 0" stroke="#fff" stroke-width="10" fill="none"/>'
          + '<path d="M88 146 l6 14 l6 -14 Z M100 146 l6 14 l6 -14 Z" fill="#fff"/>';
      case 'helmet':
        return '<path d="M18 96 a82 82 0 0 1 164 0" fill="none" stroke="#2b4da8" stroke-width="18"/>'
          + '<path d="M18 96 a82 82 0 0 1 164 0" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="10 8"/>'
          + '<path d="M64 148 q36 16 72 0" stroke="#2b4da8" stroke-width="9" fill="none"/>';
      default: return '';
    }
  }

  function svg(m) {
    m = m || mood();
    return '<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="display:block;border-radius:50%;overflow:hidden;">'
      + '<defs><radialGradient id="xxp" cx="38%" cy="28%"><stop offset="0%" stop-color="#ffe98a"/><stop offset="62%" stop-color="#f5c518"/><stop offset="100%" stop-color="#dda500"/></radialGradient></defs>'
      + '<circle cx="100" cy="100" r="92" fill="url(#xxp)"/>'
      + eyes(m.face)
      + mouth(m.face)
      + costume(m.costume)
      + '</svg>';
  }

  function mount(sel) {
    var el = document.querySelector(sel || '#petAvatar');
    if (!el) return false;
    el.innerHTML = svg(mood());
    el.style.background = 'none';
    el.style.cursor = 'pointer';
    el.title = '周星星 · 点我换个心情';
    if (!el.getAttribute('data-xx-pet')) {
      el.setAttribute('data-xx-pet', '1');
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        el.innerHTML = svg(mood());
      });
    }
    return true;
  }

  function init() {
    mount('#petAvatar');
    // 数值/日期变化时重画（每分钟检查一次）
    setInterval(function () { mount('#petAvatar'); }, 60000);
  }

  global.XingxingPet = { mount: mount, svg: svg, mood: mood };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
