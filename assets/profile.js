/* ============================================
   行醒 · 个人档案
   昵称 / 头像 / 性别 / 星座 / 等级体系
   点击侧栏用户卡片或顶栏头像 → 打开设置
   ============================================ */
(function (global) {
  'use strict';
  var KEY = 'xingxing_profile';

  var LEVELS = {
    xianxia: { name: '仙侠修行', list: ['练气一层', '练气二层', '练气三层', '练气四层', '练气五层', '练气六层', '练气七层', '练气八层', '练气九层', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期'] },
    student: { name: '学生阶段', list: ['幼儿园', '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级', '初中一年级', '初中二年级', '初中三年级', '高中一年级', '高中二年级', '高中三年级', '大学', '研究生', '博士'] },
    agency: { name: '主体性成长', list: ['Level 0 未萌芽', 'Level 1 投射性认同', 'Level 2 自我探寻', 'Level 3 边界与选择', 'Level 4 成熟自主'] },
    custom: { name: '自定义', list: ['自定义一', '自定义二', '自定义三'] }
  };
  var GENDERS = ['不透露', '女生', '男生'];
  var ZODIACS = ['不透露', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];

  function get() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(patch) {
    var cur = get();
    for (var k in patch) cur[k] = patch[k];
    try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {}
    apply();
    return cur;
  }
  function levelList(p) {
    if ((p.levelSystem || 'xianxia') === 'custom' && Array.isArray(p.customLevels) && p.customLevels.length) return p.customLevels;
    return (LEVELS[p.levelSystem || 'xianxia'] || LEVELS.xianxia).list;
  }
  function levelText() {
    var p = get();
    var list = levelList(p);
    return list[Math.max(0, Math.min((p.levelIndex || 0), list.length - 1))];
  }

  function setAvatar(el, av) {
    if (!el) return;
    if (av && av.indexOf('data:image') === 0) {
      el.textContent = '';
      el.style.backgroundImage = 'url(' + av + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    } else {
      el.style.backgroundImage = '';
      el.textContent = av || '行';
    }
  }

  function apply() {
    var p = get();
    var name = p.nickname || '';
    var av = p.avatar || (name ? name.charAt(0) : '');
    Array.prototype.forEach.call(document.querySelectorAll('.user-name, .pet-name, .sidebar-user-name, .user-nickname'), function (el) { if (name) el.textContent = name; });
    Array.prototype.forEach.call(document.querySelectorAll('.user-role, .pet-level, .sidebar-user-role, .user-level'), function (el) { el.textContent = levelText(); });
    Array.prototype.forEach.call(document.querySelectorAll('.user-avatar'), function (el) { if (av) setAvatar(el, av); });

    Array.prototype.forEach.call(document.querySelectorAll('.user-profile, #sidebarUser, .sidebar-user, .topbar .user-avatar, .topbar-right .user-avatar'), function (el) {
      if (el.getAttribute('data-xx-profile')) return;
      el.setAttribute('data-xx-profile', '1');
      el.style.cursor = 'pointer';
      el.title = '点击打开个人档案';
      el.addEventListener('click', function (e) { e.stopPropagation(); open(); });
    });
    applyBadge();
  }

  // ---------- 桌宠红点提醒 ----------
  function badgeCount() {
    try { return parseInt(localStorage.getItem('xingxing_pet_badge') || '0', 10) || 0; } catch (e) { return 0; }
  }
  function setBadge(n) {
    try { localStorage.setItem('xingxing_pet_badge', String(n || 0)); } catch (e) {}
    applyBadge();
  }
  function applyBadge() {
    var n = badgeCount();
    Array.prototype.forEach.call(document.querySelectorAll('.user-avatar, #sidebarUser'), function (el) {
      var b = el.querySelector('.xx-badge');
      if (!n) { if (b && b.parentNode) b.parentNode.removeChild(b); return; }
      if (!b) {
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        b = document.createElement('span');
        b.className = 'xx-badge';
        b.style.cssText = 'position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;border-radius:9px;background:#e11d48;color:#fff;font-size:11px;line-height:18px;text-align:center;padding:0 4px;box-shadow:0 0 0 2px #faf6ec;font-family:sans-serif;cursor:pointer;z-index:5;';
        b.addEventListener('click', function (e) { e.stopPropagation(); setBadge(0); });
        el.appendChild(b);
      }
      b.textContent = String(n);
      b.title = '有 ' + n + ' 条提醒，点击清除';
    });
  }

  function row(label, value, attr, options) {
    if (options) {
      return '<label style="display:block;margin:10px 0 4px;font-size:13px;color:#5a5a5a;">' + label + '</label>'
        + '<select data-f="' + attr + '" style="width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #d9cbae;border-radius:6px;font-family:inherit;background:#fff;">'
        + options.map(function (o, i) { return '<option value="' + o + '"' + (o === value ? ' selected' : '') + '>' + o + '</option>'; }).join('')
        + '</select>';
    }
    return '<label style="display:block;margin:10px 0 4px;font-size:13px;color:#5a5a5a;">' + label + '</label>'
      + '<input data-f="' + attr + '" value="' + String(value || '').replace(/"/g, '&quot;') + '" style="width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #d9cbae;border-radius:6px;font-family:inherit;background:#fff;" />';
  }

  function open() {
    var old = document.getElementById('xx-profile-modal');
    if (old) { old.parentNode.removeChild(old); return; }
    var p = get();
    var custom = (p.customLevels || []).join('\n');
    var levelIndex = typeof p.levelIndex === 'number' ? p.levelIndex : 0;
    var box = document.createElement('div');
    box.id = 'xx-profile-modal';
    box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9999;background:#faf6ec;border:1px solid #e8d5a3;border-radius:14px;padding:22px;box-shadow:0 20px 50px rgba(20,16,8,.35);font-family:"STKaiti","KaiTi",serif;width:88vw;max-width:420px;max-height:86vh;overflow:auto;';
    box.innerHTML =
        '<div style="font-size:18px;color:#1f1a10;letter-spacing:2px;margin-bottom:6px;">个人档案</div>'
      + '<div style="font-size:12px;color:#8a7a5e;margin-bottom:12px;">这些信息用于昵称、头像与等级展示</div>'
      + '<div style="display:flex;align-items:center;gap:14px;margin-bottom:6px;">'
      +   '<div id="xx-avatar-preview" style="width:56px;height:56px;border-radius:50%;background:#1f1a10;color:#f7ecd0;display:flex;align-items:center;justify-content:center;font-size:22px;background-size:cover;background-position:center;flex-shrink:0;">' + (p.avatar && p.avatar.indexOf('data:') === 0 ? '' : (p.avatar || '行')) + '</div>'
      +   '<div style="font-size:13px;color:#362e1f;">'
      +     '<div><label style="cursor:pointer;color:#8b6914;text-decoration:underline;">上传头像<input type="file" id="xx-avatar-file" accept="image/*" style="display:none;" /></label></div>'
      +     '<div style="margin-top:6px;">或填写一个字的头像：<input data-f="avatarText" value="' + ((p.avatar && p.avatar.indexOf('data:') === 0) ? '' : (p.avatar || '')) + '" maxlength="2" style="width:48px;padding:4px 6px;border:1px solid #d9cbae;border-radius:6px;font-family:inherit;" /></div>'
      +   '</div>'
      + '</div>'
      + row('昵称', p.nickname || '', 'nickname')
      + row('性别', p.gender || '不透露', 'gender', GENDERS)
      + row('星座', p.zodiac || '不透露', 'zodiac', ZODIACS)
      + row('等级体系', (LEVELS[p.levelSystem || 'xianxia'] || LEVELS.xianxia).name, 'levelSystem', Object.keys(LEVELS).map(function (k) { return LEVELS[k].name; }))
      + row('当前等级（按行填写自定义等级）', custom || '', 'customLevels')
      + '<div id="xx-level-table" style="margin-top:14px;font-size:13px;color:#362e1f;line-height:1.9;background:#f0ebe3;border-radius:8px;padding:12px;"></div>'
      + '<div style="margin-top:16px;display:flex;justify-content:space-between;gap:10px;">'
      +   '<button type="button" data-x="close" style="border:none;background:none;cursor:pointer;font-family:inherit;color:#8a7a5e;font-size:14px;">取消</button>'
      +   '<button type="button" data-x="save" style="border:none;border-radius:6px;padding:9px 22px;background:#1f1a10;color:#f7ecd0;cursor:pointer;font-family:inherit;font-size:14px;">保存</button>'
      + '</div>';
    document.body.appendChild(box);

    function refreshTable() {
      var sel = box.querySelector('[data-f="levelSystem"]');
      var txt = box.querySelector('[data-f="customLevels"]');
      var key = null;
      for (var k in LEVELS) if (LEVELS[k].name === sel.value) key = k;
      var customList = txt.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      var list = key === 'custom' ? (customList.length ? customList : LEVELS.custom.list) : (LEVELS[key] || LEVELS.xianxia).list;
      if (levelIndex >= list.length) levelIndex = list.length - 1;
      if (levelIndex < 0) levelIndex = 0;
      var html = '<div style="color:#8b6914;margin-bottom:6px;">' + sel.value + ' · 点一下选中当前等级</div>';
      html += list.map(function (t, i) {
        return '<div data-idx="' + i + '" style="padding:5px 8px;border-radius:6px;cursor:pointer;' + (i === levelIndex ? 'background:#1f1a10;color:#f7ecd0;' : '') + '">' + (i + 1) + '. ' + t + '</div>';
      }).join('');
      box.querySelector('#xx-level-table').innerHTML = html;
      Array.prototype.forEach.call(box.querySelectorAll('#xx-level-table [data-idx]'), function (el) {
        el.addEventListener('click', function () { levelIndex = parseInt(el.getAttribute('data-idx'), 10); refreshTable(); });
      });
    }
    refreshTable();
    box.querySelector('[data-f="levelSystem"]').addEventListener('change', refreshTable);
    box.querySelector('[data-f="customLevels"]').addEventListener('input', refreshTable);
    box.querySelector('#xx-avatar-file').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var prev = box.querySelector('#xx-avatar-preview');
        prev.textContent = '';
        prev.style.backgroundImage = 'url(' + r.result + ')';
        box.setAttribute('data-avatar', r.result);
      };
      r.readAsDataURL(f);
    });
    box.addEventListener('click', function (e) {
      var x = e.target.getAttribute && e.target.getAttribute('data-x');
      if (x === 'close') { box.parentNode.removeChild(box); return; }
      if (x !== 'save') return;
      var sel = box.querySelector('[data-f="levelSystem"]');
      var systemKey = 'xianxia';
      for (var k in LEVELS) if (LEVELS[k].name === sel.value) systemKey = k;
      var customLevels = box.querySelector('[data-f="customLevels"]').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      var avatarText = box.querySelector('[data-f="avatarText"]').value.trim();
      var patch = {
        nickname: box.querySelector('[data-f="nickname"]').value.trim(),
        gender: box.querySelector('[data-f="gender"]').value,
        zodiac: box.querySelector('[data-f="zodiac"]').value,
        levelSystem: systemKey,
        customLevels: customLevels,
        levelIndex: levelIndex
      };
      if (box.getAttribute('data-avatar')) patch.avatar = box.getAttribute('data-avatar');
      else if (avatarText) patch.avatar = avatarText;
      save(patch);
      box.parentNode.removeChild(box);
      try { if (global.XingxingCommon && global.XingxingCommon.showToast) global.XingxingCommon.showToast('个人档案已保存', 'success', 1800); } catch (e) {}
    });
  }

  global.XingxingProfile = { get: get, save: save, apply: apply, open: open, levelText: levelText, LEVELS: LEVELS, setBadge: setBadge, badgeCount: badgeCount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})(window);
