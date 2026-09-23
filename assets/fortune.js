/* ============================================
   行醒 · 星座气运
   把「月曜/水曜/土曜」这类看不懂的七曜，
   换成按用户星座推算的当天气运（宜 / 忌）。
   纯本地推算，不联网、不花钱。
   ============================================ */
(function (global) {
  'use strict';

  var ZODIACS = [
    { n: '白羊座', e: '火' }, { n: '金牛座', e: '土' }, { n: '双子座', e: '风' }, { n: '巨蟹座', e: '水' },
    { n: '狮子座', e: '火' }, { n: '处女座', e: '土' }, { n: '天秤座', e: '风' }, { n: '天蝎座', e: '水' },
    { n: '射手座', e: '火' }, { n: '摩羯座', e: '土' }, { n: '水瓶座', e: '风' }, { n: '双鱼座', e: '水' }
  ];
  var YI = {
    '火': ['果断行动', '主动表达', '运动出汗', '开启新事'],
    '土': ['踏实推进', '整理归纳', '稳中求进', '务实规划'],
    '风': ['沟通交流', '学习新知', '写作记录', '头脑风暴'],
    '水': ['静心独处', '深度思考', '倾听内心', '休养疗愈']
  };
  var JI = {
    '火': ['急躁冲动', '与人争执', '熬夜硬撑'],
    '土': ['钻牛角尖', '过度保守', '勉强自己'],
    '风': ['想多做少', '三心二意', '口无遮拦'],
    '水': ['情绪化决策', '自我内耗', '过分在意他人']
  };

  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function key() { return 'xingxing_zodiac'; }
  function getZodiac() { try { return localStorage.getItem(key()) || '巨蟹座'; } catch (e) { return '巨蟹座'; } }
  function setZodiac(z) { try { localStorage.setItem(key(), z); } catch (e) {} }
  function byName(n) { for (var i = 0; i < ZODIACS.length; i++) if (ZODIACS[i].n === n) return ZODIACS[i]; return ZODIACS[3]; }
  function dayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  function get(dateStr) {
    var z = byName(getZodiac());
    var seed = hash((dateStr || dayStr()) + z.n);
    var yi = YI[z.e][seed % YI[z.e].length];
    var ji = JI[z.e][seed % JI[z.e].length];
    return { sign: z.n, element: z.e, yi: yi, ji: ji, short: '宜' + yi, full: z.n + ' · 宜' + yi + ' · 忌' + ji };
  }

  function replaceYao(el, text) {
    if (!el) return;
    var t = el.textContent;
    if (/[月火水木金土日]曜/.test(t)) el.textContent = t.replace(/[月火水木金土日]曜(日)?/g, text);
  }

  function buildPicker() {
    var old = document.getElementById('xx-zodiac-picker');
    if (old) { old.parentNode.removeChild(old); return; }
    var box = document.createElement('div');
    box.id = 'xx-zodiac-picker';
    box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9999;background:#faf6ec;border:1px solid #e8d5a3;border-radius:12px;padding:18px;box-shadow:0 16px 40px rgba(20,16,8,.3);font-family:"STKaiti","KaiTi",serif;max-width:340px;width:88vw;';
    box.innerHTML = '<div style="font-size:15px;margin-bottom:12px;color:#1f1a10;letter-spacing:1px;">选择你的星座</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">'
      + ZODIACS.map(function (z) {
          return '<button type="button" data-z="' + z.n + '" style="padding:8px 4px;border:1px solid #e0d8cc;border-radius:6px;background:#fff;cursor:pointer;font-family:inherit;font-size:13px;color:#362e1f;">' + z.n + '</button>';
        }).join('')
      + '</div>'
      + '<div style="margin-top:12px;text-align:right;"><button type="button" data-close="1" style="border:none;background:none;cursor:pointer;font-family:inherit;color:#8a7a5e;font-size:13px;">关闭</button></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      var t = e.target;
      if (t.getAttribute('data-close')) { box.parentNode.removeChild(box); return; }
      var z = t.getAttribute('data-z');
      if (z) { setZodiac(z); box.parentNode.removeChild(box); apply(); }
    });
  }

  function apply() {
    var f = get();
    var wd = document.querySelector('.sidebar-weekday') || document.getElementById('sidebarWeekday');
    if (wd) {
      wd.textContent = f.sign + ' · ' + f.short;
      wd.title = f.full + '（点击切换星座）';
      wd.style.cursor = 'pointer';
      if (!wd.getAttribute('data-xx-bound')) {
        wd.setAttribute('data-xx-bound', '1');
        wd.addEventListener('click', function (e) { e.stopPropagation(); buildPicker(); });
      }
    }
    replaceYao(document.querySelector('.topbar-date'), f.sign);
    Array.prototype.forEach.call(document.querySelectorAll('.review-date'), function (el) { replaceYao(el, f.sign); });
  }

  function sweep() {
    var f = get();
    var all = document.querySelectorAll('body *');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.children.length === 0 && el.id !== 'xx-zodiac-picker' && /[月火水木金土日]曜/.test(el.textContent)) {
        replaceYao(el, f.sign);
      }
    }
  }

  function init() { sweep(); apply(); }

  global.XingxingFortune = { ZODIACS: ZODIACS, get: get, getZodiac: getZodiac, setZodiac: setZodiac, apply: apply };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
