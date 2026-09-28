/* ============================================
   行醒 · 桌宠「周星星」
   黑白线条风 Q 版剑客：高马尾 + 背刀；
   表情走「五条悟」那路（墨镜 / 眼罩 / 慵懒 / 坏笑），
   按 状态 / 精力 / 精神 分档随机出现。
   ============================================ */
(function (global) {
  'use strict';

  var INK = '#1b1b1b', HAIR = '#22201d', HAIR2 = '#3a3630', SKIN = '#ffffff', CLOTH = '#ffffff';
  var SW = 3.2;

  function num(fn, dft) { try { var v = fn(); return typeof v === 'number' && !isNaN(v) ? v : dft; } catch (e) { return dft; } }
  function stat() {
    var A = global.XingxingCommon;
    if (!A) return { s: 75, e: 80, m: 80 };
    return { s: num(A.getState, 75), e: num(A.getEnergy, 80), m: num(A.getMental, 80) };
  }
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var EYEWEAR = ['sunglasses', 'blindfold'];
  var HATS = ['party', 'cat', 'nightcap'];

  function mood() {
    var v = stat(), r = Math.random();
    if (v.s <= 10) return { face: 'blank' };
    if (v.e <= 25) return { face: 'sleepy', hat: 'nightcap' };
    if (v.m <= 30) return { face: 'cry' };
    if (r < 0.3) return { face: pick(EYEWEAR), book: Math.random() < 0.6 };
    if (v.e >= 70 && v.e <= 80) return { face: pick(['smug', 'wink', 'tease']) };
    if (v.s >= 70 && v.s <= 90) return { face: pick(['happy', 'giggle']), hat: r < 0.5 ? pick(HATS) : null };
    if (v.m >= 90) return { face: 'sunglasses', book: true };
    return { face: pick(['normal', 'happy', 'wink', 'star']), hat: r < 0.25 ? pick(HATS) : null };
  }

  // ---------- 眼睛 ----------
  function eyes(kind) {
    var L = 86, R = 114, Y = 76;
    function dot(cx, r) {
      return '<circle cx="' + cx + '" cy="' + Y + '" r="' + r + '" fill="' + INK + '"/>';
    }
    function openEye(cx) {
      return '<ellipse cx="' + cx + '" cy="' + Y + '" rx="8" ry="9" fill="#fff" stroke="' + INK + '" stroke-width="2.6"/>'
        + '<circle cx="' + cx + '" cy="' + (Y + 1) + '" r="4.2" fill="' + INK + '"/>';
    }
    switch (kind) {
      case 'blank':
        return '<path d="M75 76 h20" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>'
          + '<path d="M105 76 h20" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>';
      case 'sleepy':
        return '<path d="M75 78 q11 -9 21 0" stroke="' + INK + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
          + '<path d="M104 78 q11 -9 21 0" stroke="' + INK + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
          + '<text x="140" y="48" font-size="17" font-weight="bold" fill="#5b7fd6" font-family="sans-serif">z</text>';
      case 'cry':
        return openEye(L) + openEye(R)
          + '<path d="M76 88 q0 8 -2 12" stroke="#63c6f5" stroke-width="3" fill="none" stroke-linecap="round"/>'
          + '<path d="M124 88 q0 8 -2 12" stroke="#63c6f5" stroke-width="3" fill="none" stroke-linecap="round"/>'
          + '<path d="M72 62 q13 -7 24 -1" stroke="' + INK + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
          + '<path d="M104 61 q13 -6 24 1" stroke="' + INK + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
      case 'tease':
        return dot(L, 3.4) + '<path d="M104 78 q11 -8 21 0" stroke="' + INK + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
      case 'wink':
        return '<path d="M75 78 q11 -9 21 0" stroke="' + INK + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>' + dot(R, 3.4);
      case 'smug':
        return '<path d="M75 74 q11 8 22 0" stroke="' + INK + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
          + '<path d="M103 74 q11 8 22 0" stroke="' + INK + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
      case 'giggle':
      case 'happy':
        return '<path d="M75 79 q11 -11 21 0" stroke="' + INK + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
          + '<path d="M104 79 q11 -11 21 0" stroke="' + INK + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
      case 'star':
        return '<path d="M86 68 l2.4 6.4 6.6 .4 -5 4.4 1.6 6.6 -5.6 -3.8 -5.6 3.8 1.6 -6.6 -5 -4.4 6.6 -.4 Z" fill="' + INK + '"/>'
          + '<path d="M114 68 l2.4 6.4 6.6 .4 -5 4.4 1.6 6.6 -5.6 -3.8 -5.6 3.8 1.6 -6.6 -5 -4.4 6.6 -.4 Z" fill="' + INK + '"/>';
      case 'angry':
        return dot(L, 3.6) + dot(R, 3.6)
          + '<path d="M72 60 l22 9" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/>'
          + '<path d="M128 60 l-22 9" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/>';
      case 'sunglasses':
        return '<rect x="68" y="66" width="31" height="19" rx="7" fill="' + INK + '"/>'
          + '<rect x="101" y="66" width="31" height="19" rx="7" fill="' + INK + '"/>'
          + '<path d="M99 73 h2" stroke="' + INK + '" stroke-width="4"/>'
          + '<path d="M68 72 h-7 M132 72 h7" stroke="' + INK + '" stroke-width="2.6"/>';
      case 'blindfold':
        return '<path d="M60 66 q40 -10 80 0 l0 18 q-40 8 -80 0 Z" fill="' + INK + '"/>'
          + '<path d="M60 74 q40 -7 80 0" stroke="#4a4a4a" stroke-width="1.6" fill="none"/>';
      default:
        return openEye(L) + openEye(R);
    }
  }

  // ---------- 嘴 ----------
  function mouth(kind) {
    switch (kind) {
      case 'blank': return '<path d="M94 99 h12" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
      case 'cry': return '<ellipse cx="100" cy="102" rx="6" ry="8" fill="' + INK + '"/>';
      case 'sleepy': return '<ellipse cx="100" cy="101" rx="5" ry="7" fill="' + INK + '"/>';
      case 'happy':
      case 'giggle': return '<path d="M88 94 q12 13 24 0" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
      case 'smug': return '<path d="M89 100 q11 6 22 -3" stroke="' + INK + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
      case 'angry': return '<path d="M91 103 q9 -5 18 0" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
      case 'sunglasses':
      case 'blindfold': return '<path d="M92 98 q8 7 16 -2" stroke="' + INK + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
      case 'tease':
      case 'wink': return '<path d="M94 99 q6 5 12 0" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
      default: return '<path d="M95 99 q5 4 10 0" stroke="' + INK + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
    }
  }

  function hat(kind) {
    switch (kind) {
      case 'party':
        return '<path d="M100 10 L120 44 L80 44 Z" fill="' + HAIR + '"/><circle cx="100" cy="10" r="4.5" fill="#e0483a"/>';
      case 'cat':
        return '<path d="M68 44 L58 16 L86 32 Z" fill="' + HAIR + '"/><path d="M132 44 L142 16 L114 32 Z" fill="' + HAIR + '"/>';
      case 'nightcap':
        return '<path d="M62 48 q38 -46 80 -4 q-16 -6 -40 -3 q-22 -3 -40 7 Z" fill="' + HAIR2 + '"/><circle cx="144" cy="44" r="5.5" fill="#fff" stroke="' + INK + '" stroke-width="2"/>';
      default: return '';
    }
  }

  function sword() {
    return '<g transform="rotate(38 100 122)">'
      + '<path d="M100 92 L100 208" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/>'
      + '<path d="M100 92 L100 208" stroke="#9a9a9a" stroke-width="2"/>'
      + '<path d="M88 83 L112 83" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>'
      + '<path d="M94 34 L106 34 L106 79 L94 79 Z" fill="#fff" stroke="' + INK + '" stroke-width="3"/>'
      + '<path d="M94 44 L106 56 M106 44 L94 56" stroke="' + INK + '" stroke-width="1.8"/>'
      + '</g>';
  }

  function ponytail() {
    return '<path d="M78 26 q-44 4 -56 48 q-9 32 6 64 q-13 -36 -1 -60 q12 -26 48 -30 Z" fill="' + HAIR + '"/>'
      + '<path d="M72 34 q-34 12 -38 46 q-4 26 8 48 q-9 -28 -1 -46 q9 -18 31 -26 Z" fill="' + HAIR2 + '"/>'
      + '<path d="M66 30 q10 -6 20 -2" stroke="' + INK + '" stroke-width="2" fill="none"/>';
  }

  function body() {
    return '<path d="M100 112 q-26 6 -34 30 l-10 68 q44 12 88 0 l-10 -68 q-8 -24 -34 -30 Z" fill="' + CLOTH + '" stroke="' + INK + '" stroke-width="' + SW + '"/>'
      + '<path d="M89 116 l11 17 l11 -17" fill="none" stroke="' + INK + '" stroke-width="' + SW + '" stroke-linejoin="round"/>'
      + '<path d="M60 158 h80" stroke="' + INK + '" stroke-width="' + SW + '"/>'
      + '<path d="M92 158 l8 20 l8 -20" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>'
      + '<path d="M74 140 q-4 26 -8 62" stroke="' + INK + '" stroke-width="1.8" fill="none" opacity="0.5"/>';
  }

  function book() {
    return '<path d="M56 168 q44 -16 88 0 q-44 15 -88 0 Z" fill="#fff" stroke="' + INK + '" stroke-width="2.4"/>'
      + '<path d="M100 166 l0 17" stroke="' + INK + '" stroke-width="2"/>'
      + '<path d="M64 168 q36 -10 72 0" stroke="' + INK + '" stroke-width="1.4" fill="none" opacity="0.6"/>';
  }

  function svg(m) {
    m = m || mood();
    return '<svg viewBox="0 0 200 230" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;">'
      + sword()
      + ponytail()
      + '<path d="M92 106 h16 v14 h-16 Z" fill="' + SKIN + '" stroke="' + INK + '" stroke-width="' + SW + '"/>'
      + body()
      + '<circle cx="100" cy="74" r="40" fill="' + SKIN + '" stroke="' + INK + '" stroke-width="' + SW + '"/>'
      + '<path d="M61 72 q2 -39 39 -39 q37 0 39 39 q-10 -20 -39 -20 q-29 0 -39 20 Z" fill="' + HAIR + '"/>'
      + '<path d="M68 58 q16 -13 32 -6 q-18 2 -27 12 Z" fill="' + HAIR2 + '"/>'
      + eyes(m.face)
      + mouth(m.face)
      + hat(m.hat)
      + (m.book ? book() : '')
      + '</svg>';
  }

  function mount(sel) {
    var el = document.querySelector(sel || '#petAvatar');
    if (!el) return false;
    el.innerHTML = svg(mood());
    el.style.background = '#fff';
    el.style.cursor = 'pointer';
    el.title = '周星星 · 点我换个表情';
    if (!el.getAttribute('data-xx-pet')) {
      el.setAttribute('data-xx-pet', '1');
      el.addEventListener('click', function (e) { e.stopPropagation(); el.innerHTML = svg(mood()); });
    }
    return true;
  }

  function init() {
    mount('#petAvatar');
    setInterval(function () { mount('#petAvatar'); }, 60000);
  }

  global.XingxingPet = { mount: mount, svg: svg, mood: mood };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
