/* 桌宠行为：配件、说话、拖动、朝向 */
(function () {
  'use strict';
  var INK = '#141414';
  var pet = document.getElementById('pet');
  var bubble = document.getElementById('bubble');
  var flipped = false;

  // 配件（位置按人物图构图，百分比）
  var PROPS = {
    sunglasses: { left: '46%', top: '32%', width: '20%', svg: '<svg viewBox="0 0 64 26"><rect x="6" y="4" width="26" height="17" rx="7" fill="' + INK + '"/><path d="M32 11 h26" stroke="' + INK + '" stroke-width="3.4"/></svg>' },
    blindfold: { left: '36%', top: '30%', width: '34%', svg: '<svg viewBox="0 0 80 24"><path d="M2 13 q38 -10 76 0" stroke="' + INK + '" stroke-width="11" fill="none" stroke-linecap="round"/></svg>' },
    party: { left: '36%', top: '1%', width: '22%', svg: '<svg viewBox="0 0 60 60"><path d="M30 6 L48 54 L12 54 Z" fill="#e0483a"/><circle cx="30" cy="6" r="6" fill="#f5c518"/></svg>' },
    nightcap: { left: '26%', top: '0%', width: '42%', svg: '<svg viewBox="0 0 100 60"><path d="M4 44 q34 -50 92 -6 q-20 -6 -46 -3 q-26 -3 -46 9 Z" fill="#3b4fa8"/><circle cx="92" cy="34" r="7" fill="#fff"/></svg>' },
    cat: { left: '28%', top: '1%', width: '44%', svg: '<svg viewBox="0 0 100 50"><path d="M14 44 L8 6 L40 30 Z" fill="' + INK + '"/><path d="M86 44 L92 6 L60 30 Z" fill="' + INK + '"/></svg>' },
    cola: { left: '68%', top: '60%', width: '16%', svg: '<svg viewBox="0 0 40 70"><rect x="6" y="8" width="28" height="54" rx="8" fill="#c0392b"/><rect x="6" y="26" width="28" height="16" fill="#fff"/><rect x="10" y="2" width="20" height="8" rx="3" fill="#8a8a8a"/></svg>' },
    book: { left: '2%', top: '60%', width: '28%', svg: '<svg viewBox="0 0 80 50"><path d="M4 26 q36 -16 72 0 q-36 14 -72 0 Z" fill="#fff" stroke="' + INK + '" stroke-width="3"/><path d="M40 25 l0 14" stroke="' + INK + '" stroke-width="2.4"/></svg>' },
    tea: { left: '14%', top: '58%', width: '18%', svg: '<svg viewBox="0 0 60 60"><path d="M10 34 h32 l-4 22 h-24 Z" fill="#fff" stroke="' + INK + '" stroke-width="3"/><path d="M20 28 q6 -8 0 -14 M32 28 q6 -8 0 -14" stroke="' + INK + '" stroke-width="2.4" fill="none"/></svg>' },
    sword: { left: '66%', top: '18%', width: '20%', svg: '<svg viewBox="0 0 40 80"><path d="M20 4 L20 62" stroke="' + INK + '" stroke-width="6"/><path d="M8 62 L32 62" stroke="' + INK + '" stroke-width="5"/></svg>' }
  };

  var SAY = ['今天也要好好活着呀。', '又摸鱼？我看见了。', '要不要喝口水？', '别熬太晚，我看着呢。',
    '这事儿，明天再说也行。', '你已经比昨天强了。', '累就歇会儿，我替你看着。', '在想什么呢？'];
  var KEYS = Object.keys(PROPS);

  function roll() {
    var list = [];
    if (Math.random() < 0.45) list.push('sunglasses');
    if (Math.random() < 0.25) list.push(Math.random() < 0.5 ? 'blindfold' : 'party');
    if (Math.random() < 0.3) list.push(Math.random() < 0.5 ? 'cola' : 'tea');
    if (Math.random() < 0.3) list.push('book');
    if (Math.random() < 0.2) list.push(Math.random() < 0.5 ? 'cat' : 'nightcap');
    if (Math.random() < 0.15) list.push('sword');
    if (!list.length) list.push(KEYS[Math.floor(Math.random() * KEYS.length)]);
    return list;
  }

  function dress() {
    pet.querySelectorAll('.prop').forEach(function (n) { n.remove(); });
    roll().forEach(function (k) {
      var p = PROPS[k];
      if (!p) return;
      var d = document.createElement('div');
      d.className = 'prop';
      d.style.left = p.left; d.style.top = p.top; d.style.width = p.width;
      d.innerHTML = p.svg;
      pet.appendChild(d);
    });
  }

  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(say._t);
    say._t = setTimeout(function () { bubble.classList.remove('show'); }, ms || 2600);
  }

  // 点击：换装 + 说一句
  document.body.addEventListener('click', function (e) {
    if (dragMoved) return;
    dress();
    say(SAY[Math.floor(Math.random() * SAY.length)]);
  });

  // 拖动
  var dragging = false, dragMoved = false, lastX = 0, lastY = 0;
  document.body.addEventListener('mousedown', function (e) {
    dragging = true; dragMoved = false; lastX = e.screenX; lastY = e.screenY;
    document.body.classList.add('dragging');
  });
  window.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    var dx = e.screenX - lastX, dy = e.screenY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragMoved = true;
    if (dx || dy) { window.petAPI && window.petAPI.dragMove(dx, dy); lastX = e.screenX; lastY = e.screenY; }
  });
  window.addEventListener('mouseup', function () { dragging = false; document.body.classList.remove('dragging'); });

  // 主进程通知朝向
  window.petAPI && window.petAPI.onFace && window.petAPI.onFace(function (d) {
    pet.classList.toggle('flip', d < 0);
  });

  dress();
  setTimeout(function () { say('我是周星星，多多指教。', 3000); }, 600);
  setInterval(function () { if (Math.random() < 0.3) dress(); }, 20000);
})();
