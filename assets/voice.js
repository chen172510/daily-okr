/* 通用语音输入：给任意按钮加 data-voice="#目标选择器" 即可用 */
(function (global) {
  'use strict';
  var SR = global.SpeechRecognition || global.webkitSpeechRecognition;

  function toast(msg) {
    try { if (global.XingxingCommon && XingxingCommon.showToast) { XingxingCommon.showToast(msg, 'warning', 2600); return; } } catch (e) {}
    alert(msg);
  }

  function bind(btn, target) {
    var active = null;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (active) { try { active.stop(); } catch (err) {} active = null; btn.classList.remove('listening'); return; }
      if (!SR) { toast('当前浏览器不支持语音识别，建议用 Chrome / Edge'); return; }
      var rec = new SR();
      rec.lang = 'zh-CN';
      rec.interimResults = true;
      rec.continuous = true;
      var base = target.value || '', finalText = '';
      active = rec;
      btn.classList.add('listening');
      rec.onresult = function (ev) {
        var interim = '';
        for (var i = ev.resultIndex; i < ev.results.length; i++) {
          if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript;
          else interim += ev.results[i][0].transcript;
        }
        target.value = base + finalText + interim;
      };
      rec.onerror = function (ev) {
        active = null; btn.classList.remove('listening');
        if ((ev.error || '') === 'network') toast('语音识别连不上服务器（国内 Chrome 常连不上 Google）。可改用 Edge，或直接键盘输入。');
        else toast('语音识别没成功：' + (ev.error || '未知原因'));
      };
      rec.onend = function () { active = null; btn.classList.remove('listening'); };
      try { rec.start(); } catch (err) { active = null; btn.classList.remove('listening'); toast('无法启动语音识别'); }
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

  global.XingxingVoice = { bind: bind, init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
