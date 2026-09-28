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

  var COSTUMES = ['party', 'pirate', 'vampire', 'helmet', 'cat', 'nightcap'];
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  // 依据三档数值挑「表情 + 配件」；档位内随机
  function mood() {
    var v = stat();
    var r = Math.random();
    if (v.s <= 10) return { face: 'blank' };
    if (v.e <= 25) return { face: 'sleepy', costume: 'nightcap' };
    if (v.m <= 30) return { face: 'cry' };
    if (r < 0.22) return { face: 'sunglasses', book: true };
    if (v.e >= 70 && v.e <= 80) return { face: pick(['tease', 'wink', 'wink2', 'smug']) };
    if (v.s >= 70 && v.s <= 90) return { face: pick(['happy', 'giggle']), costume: pick(COSTUMES) };
    if (v.m >= 90) return { face: 'sunglasses', book: true };
    return { face: pick(['normal', 'happy', 'wink', 'love', 'star']), costume: r < 0.4 ? pick(COSTUMES) : null };
  }

  // 马尾（束在左上方，参考背面立绘）
  function hair() {
    return '<g>'
      + '<path d="M50 34 q-42 10 -46 56 q-4 38 13 68 q-15 -38 -3 -66 q12 -28 42 -34 Z" fill="#2a2724"/>'
      + '<path d="M44 42 q-32 14 -36 48 q-4 28 11 50 q-11 -28 -2 -48 q10 -20 31 -28 Z" fill="#3d3833"/>'
      + '<ellipse cx="54" cy="32" rx="15" ry="8" fill="#c9a227" transform="rotate(-20 54 32)"/>'
      + '</g>';
  }

  // 背上的刀
  function sword() {
    return '<g transform="rotate(40 100 100)">'
      + '<rect x="94" y="74" width="12" height="132" rx="6" fill="#33333a"/>'
      + '<rect x="97" y="80" width="3" height="118" fill="#74747d"/>'
      + '<rect x="84" y="66" width="32" height="10" rx="3" fill="#8b6914"/>'
      + '<rect x="91" y="6" width="18" height="60" rx="8" fill="#4a3a22"/>'
      + '<path d="M100 18 l0 30" stroke="#c9a227" stroke-width="2.4"/>'
      + '</g>';
  }

  // 手里翻的书
  function book() {
    return '<g>'
      + '<path d="M46 160 q54 -20 108 0 q-54 18 -108 0 Z" fill="#f4e8cf" stroke="#8b6914" stroke-width="2"/>'
      + '<path d="M100 157 l0 21" stroke="#8b6914" stroke-width="2"/>'
      + '<path d="M56 160 q44 -13 88 0" stroke="#c9bda8" stroke-width="1.5" fill="none"/>'
      + '<path d="M60 166 q40 -11 80 0" stroke="#dfd2b6" stroke-width="1.2" fill="none"/>'
      + '</g>';
  }

  function eyes(kind) {
    var L = 66, R = 134, Y = 94;
    function eye(cx, rx, ry, pr) {
      return '<ellipse cx="' + cx + '" cy="' + Y + '" rx="' + rx + '" ry="' + ry + '" fill="#fff"/>'
        + '<circle cx="' + cx + '" cy="' + (Y + 1) + '" r="' + pr + '" fill="#141414"/>'
        + '<circle cx="' + (cx - pr * 0.34) + '" cy="' + (Y - pr * 0.42) + '" r="' + (pr * 0.3) + '" fill="#fff"/>';
    }
    switch (kind) {
      case 'blank':
        return '<rect x="48" y="90" width="36" height="9" rx="4.5" fill="#141414"/>'
          + '<rect x="116" y="90" width="36" height="9" rx="4.5" fill="#141414"/>';
      case 'sleepy':
        return '<path d="M48 96 q18 -15 36 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>'
          + '<path d="M116 96 q18 -15 36 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>'
          + '<text x="148" y="60" font-size="30" font-weight="bold" fill="#5b7fd6" font-family="sans-serif">z</text>'
          + '<text x="166" y="42" font-size="20" font-weight="bold" fill="#8aa6e8" font-family="sans-serif">z</text>';
      case 'cry':
        return eye(L, 26, 24, 17) + eye(R, 26, 24, 17)
          + '<ellipse cx="52" cy="132" rx="7" ry="12" fill="#63c6f5"/>'
          + '<ellipse cx="148" cy="126" rx="7" ry="12" fill="#63c6f5"/>'
          + '<path d="M46 78 q20 -12 40 -2" stroke="#141414" stroke-width="6" fill="none" stroke-linecap="round"/>'
          + '<path d="M114 76 q20 -10 40 2" stroke="#141414" stroke-width="6" fill="none" stroke-linecap="round"/>';
      case 'tease':
        return eye(L, 24, 22, 15)
          + '<path d="M112 96 q20 -13 42 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>';
      case 'wink':
        return eyes('tease');
      case 'smug':
        return '<path d="M48 90 q18 15 38 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>'
          + eye(R, 24, 22, 15);
      case 'giggle':
        return '<path d="M50 98 q16 -20 34 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>'
          + '<path d="M116 98 q16 -20 34 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>';
      case 'love':
        return '<text x="46" y="110" font-size="44" fill="#e11d48" font-family="sans-serif">♥</text>'
          + '<text x="114" y="110" font-size="44" fill="#e11d48" font-family="sans-serif">♥</text>';
      case 'star':
        return '<text x="46" y="110" font-size="42" fill="#f59e0b" font-family="sans-serif">✦</text>'
          + '<text x="116" y="110" font-size="42" fill="#f59e0b" font-family="sans-serif">✦</text>';
      case 'angry':
        return eye(L, 24, 20, 15) + eye(R, 24, 20, 15)
          + '<path d="M44 70 l38 16" stroke="#141414" stroke-width="8" stroke-linecap="round"/>'
          + '<path d="M156 70 l-38 16" stroke="#141414" stroke-width="8" stroke-linecap="round"/>';
      case 'sunglasses':
        return '<rect x="42" y="80" width="52" height="30" rx="8" fill="#1a1a1a"/>'
          + '<rect x="106" y="80" width="52" height="30" rx="8" fill="#1a1a1a"/>'
          + '<rect x="92" y="90" width="16" height="8" fill="#1a1a1a"/>';
      case 'wink2':
        return '<path d="M48 96 q18 -18 36 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>'
          + eye(R, 24, 22, 15);
      case 'happy':
        return '<path d="M50 98 q16 -20 34 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>'
          + '<path d="M116 98 q16 -20 34 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>';
      default:
        return eye(L, 26, 24, 17) + eye(R, 26, 24, 17);
    }
  }

  function mouth(kind) {
    switch (kind) {
      case 'blank': return '<rect x="88" y="138" width="24" height="7" rx="3.5" fill="#141414"/>';
      case 'cry': return '<ellipse cx="100" cy="146" rx="13" ry="17" fill="#141414"/>';
      case 'sleepy': return '<ellipse cx="100" cy="144" rx="10" ry="13" fill="#141414"/>';
      case 'love': return '<path d="M76 138 q24 26 48 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>';
      case 'happy':
      case 'giggle': return '<path d="M72 136 q28 32 56 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>';
      case 'smug': return '<path d="M80 144 q20 11 40 -4" stroke="#141414" stroke-width="7" fill="none" stroke-linecap="round"/>';
      case 'angry': return '<path d="M82 148 q18 -10 36 0" stroke="#141414" stroke-width="8" fill="none" stroke-linecap="round"/>';
      case 'tease':
      case 'wink':
      case 'wink2': return '<ellipse cx="100" cy="142" rx="10" ry="8" fill="#141414"/>';
      default: return '<ellipse cx="100" cy="142" rx="8" ry="6" fill="#141414"/>';
    }
  }

  function costume(kind) {
    switch (kind) {
      case 'party':
        return '<path d="M100 4 L132 56 L68 56 Z" fill="#e0483a"/>'
          + '<circle cx="100" cy="4" r="8" fill="#f5c518"/>'
          + '<circle cx="84" cy="46" r="4.5" fill="#fff"/><circle cx="114" cy="48" r="4.5" fill="#7fd1ff"/>';
      case 'pirate':
        return '<path d="M12 96 q88 -62 176 0 q-88 -20 -176 0 Z" fill="#e0483a"/>'
          + '<path d="M14 96 q86 -30 172 0" stroke="#141414" stroke-width="3" fill="none"/>'
          + '<path d="M100 62 l0 44" stroke="#141414" stroke-width="3"/>'
          + '<circle cx="136" cy="96" r="22" fill="#141414"/>'
          + '<path d="M122 96 l28 0 M136 84 l0 24" stroke="#fff" stroke-width="4"/>';
      case 'vampire':
        return '<path d="M10 152 q90 -48 180 0 l0 52 l-180 0 Z" fill="#7d1a1a"/>'
          + '<path d="M10 152 q90 -36 180 0" stroke="#fff" stroke-width="11" fill="none"/>'
          + '<path d="M86 148 l7 16 l7 -16 Z M100 148 l7 16 l7 -16 Z" fill="#fff"/>';
      case 'helmet':
        return '<path d="M14 100 a86 86 0 0 1 172 0" fill="none" stroke="#2b4da8" stroke-width="20"/>'
          + '<path d="M14 100 a86 86 0 0 1 172 0" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="10 8"/>'
          + '<path d="M56 156 q44 18 88 0" stroke="#2b4da8" stroke-width="10" fill="none"/>'
          + '<path d="M100 100 l0 56" stroke="#2b4da8" stroke-width="8"/>';
      case 'cat':
        return '<path d="M46 52 L34 12 L74 36 Z" fill="#f5c518" stroke="#141414" stroke-width="4"/>'
          + '<path d="M154 52 L166 12 L126 36 Z" fill="#f5c518" stroke="#141414" stroke-width="4"/>'
          + '<path d="M40 130 l-24 -6 M40 144 l-24 6" stroke="#141414" stroke-width="3"/>'
          + '<path d="M160 130 l24 -6 M160 144 l24 6" stroke="#141414" stroke-width="3"/>';
      case 'nightcap':
        return '<path d="M40 66 q60 -78 122 -6 q-24 -8 -60 -4 q-34 -4 -62 10 Z" fill="#3b4fa8"/>'
          + '<circle cx="166" cy="58" r="9" fill="#fff"/>'
          + '<text x="22" y="70" font-size="24" font-weight="bold" fill="#8aa6e8" font-family="sans-serif">z</text>';
      default: return '';
    }
  }

  function svg(m) {
    m = m || mood();
    return '<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;">'
      + '<defs>'
      + '<radialGradient id="xxp" cx="36%" cy="26%" r="82%">'
      + '<stop offset="0%" stop-color="#fff2a8"/><stop offset="45%" stop-color="#f7d046"/><stop offset="100%" stop-color="#d99e05"/>'
      + '</radialGradient>'
      + '<radialGradient id="xxs" cx="50%" cy="50%" r="50%">'
      + '<stop offset="0%" stop-color="#ffe37a"/><stop offset="100%" stop-color="#c98f04"/>'
      + '</radialGradient>'
      + '</defs>'
      + sword()
      + '<g transform="translate(100,100) scale(0.78) translate(-100,-100)">'
      +   '<circle cx="100" cy="100" r="96" fill="url(#xxs)"/>'
      +   '<circle cx="100" cy="100" r="94" fill="url(#xxp)"/>'
      +   '<ellipse cx="70" cy="52" rx="34" ry="20" fill="#fffdf0" opacity="0.5" transform="rotate(-24 70 52)"/>'
      +   '<circle cx="100" cy="100" r="94" fill="none" stroke="#c98f04" stroke-width="2" opacity="0.45"/>'
      +   costume(m.costume)
      +   eyes(m.face)
      +   mouth(m.face)
      + '</g>'
      + hair()
      + (m.book ? book() : '')
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
