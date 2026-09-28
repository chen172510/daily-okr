/* 通用语音输入：给任意按钮加 data-voice="#目标选择器" 即可用 */
(function (global) {
  'use strict';
  var SR = global.SpeechRecognition || global.webkitSpeechRecognition;

  function toast(msg) {
    try { if (global.XingxingCommon && XingxingCommon.showToast) { XingxingCommon.showToast(msg, 'warning', 2600); return; } } catch (e) {}
    alert(msg);
  }

  // 国内 Chrome 连不上谷歌语音服务时，弹一条「用 Edge 打开」的小提示
  var isEdge = /Edg\//.test(navigator.userAgent);
  function suggestEdge() {
    try {
      if (document.getElementById('xx-edge-tip')) return;
      var tip = document.createElement('div');
      tip.id = 'xx-edge-tip';
      tip.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9998;max-width:92vw;'
        + 'background:#1f1a10;color:#f7ecd0;padding:10px 14px;border-radius:10px;font-family:"STKaiti","KaiTi",serif;'
        + 'font-size:13px;box-shadow:0 10px 26px rgba(0,0,0,.32);display:flex;align-items:center;gap:10px;';
      var span = document.createElement('span');
      span.textContent = isEdge ? '还是连不上？检查一下系统的麦克风权限。' : '国内 Chrome 连不上谷歌的语音服务，换 Edge 就能用：';
      tip.appendChild(span);
      if (!isEdge) {
        var a = document.createElement('a');
        a.textContent = '用 Edge 打开这个页面';
        a.setAttribute('href', 'microsoft-edge:' + location.href);
        a.style.cssText = 'color:#e8c97a;text-decoration:underline;cursor:pointer;white-space:nowrap;';
        tip.appendChild(a);
      }
      var close = document.createElement('button');
      close.textContent = '×';
      close.setAttribute('type', 'button');
      close.style.cssText = 'border:none;background:none;color:#b8b0a0;font-size:16px;cursor:pointer;line-height:1;';
      close.onclick = function () { tip.remove(); };
      tip.appendChild(close);
      document.body.appendChild(tip);
    } catch (e) {}
  }

  function bind(btn, target) {
    var active = null;

    function start(useLocal, base, apply) {
      var rec = new SR();
      rec.lang = 'zh-CN';
      rec.interimResults = true;
      rec.continuous = true;
      if (useLocal) rec.processLocally = true;   // 本机识别：不依赖 Google 服务器
      var finalText = '';
      active = rec;
      btn.classList.add('listening');
      rec.onresult = function (ev) {
        var interim = '';
        for (var i = ev.resultIndex; i < ev.results.length; i++) {
          if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript;
          else interim += ev.results[i][0].transcript;
        }
        apply(finalText + interim);
      };
      rec.onerror = function (ev) {
        var code = ev.error || '';
        // 云端连不上（国内常见）→ 自动改用本机离线识别试一次
        if (!useLocal && (code === 'network' || code === 'service-not-allowed')) {
          active = null;
          btn.classList.remove('listening');
          try { rec.abort(); } catch (e) {}
          try {
            start(true, base, apply);
            return;
          } catch (e) {}
        }
        active = null; btn.classList.remove('listening');
        if (code === 'not-allowed' || code === 'service-not-allowed') toast('麦克风被拒绝了，请在浏览器地址栏左边允许麦克风');
        else if (code === 'network') { toast('语音识别连不上谷歌服务器（国内 Chrome 常见）。可以改用 Edge 浏览器，或开着 VPN 再试。'); suggestEdge(); }
        else if (code === 'language-not-supported' || code === 'language-not-available') toast('本机还没有中文语音包：可在 Chrome 设置里下载离线语音识别语言包，或改用 Edge。');
        else toast('语音识别没成功：' + (code || '未知原因'));
      };
      rec.onend = function () {
        active = null; btn.classList.remove('listening');
        if (useLocal && !finalText) {
          toast('本机离线识别没听清，再说一次试试（也可以直接键盘输入）');
        }
      };
      try { rec.start(); } catch (err) { active = null; btn.classList.remove('listening'); throw err; }
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (active) { try { active.stop(); } catch (err) {} active = null; btn.classList.remove('listening'); return; }
      if (!SR) { toast('当前浏览器不支持语音识别，建议用 Chrome / Edge'); return; }
      var base = target.value || '';
      try {
        start(false, base, function (text) { target.value = base + text; });
      } catch (err) {
        toast('无法启动语音识别');
      }
    });
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-voice]'), function (btn) {
      var sel = btn.getAttribute('data-voice');
      var target = sel ? document.querySelector(sel) : null;
      if (!target) {
        var wrap = btn.closest('.form-group, .field, div');
        target = wrap ? wrap.querySelector('textarea, input[type=text]') : null;
      }
      if (target) bind(btn, target);
    });
  }

  global.XingxingVoice = { bind: bind, init: init, suggestEdge: suggestEdge };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
