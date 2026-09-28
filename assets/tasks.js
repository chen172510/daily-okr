/* ============================================
   行醒 · 统一任务层（XingxingTasks）

   一个任务只存一份数据，但会被「每日计划 / 今日行醒 /
   一日修行图 / 目标图谱 / 每日复盘」共同读取和修改。

   存储：
   - xingxing_daily_plan : { date, plans:[ {id,name,startTime,endTime,category,note,...} ] }
                          （沿用老结构，新增状态字段，旧页面不会坏）
   - xingxing_task_links : { taskId: { okrId, krIndex, krTitle } }
   - xingxing_day_usage  : { 'YYYY-MM-DD': { first, last, visits } }
   ============================================ */
(function (global) {
  'use strict';

  var PLAN_KEY = 'xingxing_daily_plan';
  var LINK_KEY = 'xingxing_task_links';
  var USAGE_KEY = 'xingxing_day_usage';
  var HISTORY_KEY = 'xingxing_day_history';
  var OKR_KEY = 'xingxing_okrs';
  var EVT = 'xingxing:tasks-changed';

  function pad(n) { return String(n).padStart(2, '0'); }
  function todayStr(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function nowMinutes(d) {
    d = d || new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  function toMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== 'string') return 0;
    var p = hhmm.split(':');
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var v = JSON.parse(raw);
      return (v === null || v === undefined) ? fallback : v;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  // ---------- 事件 ----------
  var listeners = [];
  function on(cb) { if (typeof cb === 'function') listeners.push(cb); }
  function emit(detail) {
    try { snapshot(); } catch (e) {}
    listeners.forEach(function (cb) { try { cb(detail); } catch (e) {} });
    try { global.dispatchEvent(new CustomEvent(EVT, { detail: detail || {} })); } catch (e) {}
  }
  // 别的标签页改了数据也能同步
  global.addEventListener('storage', function (e) {
    if (e.key === PLAN_KEY || e.key === LINK_KEY) emit({ remote: true });
  });

  // ---------- 任务读取 ----------
  function emptyPlan() { return { date: todayStr(), plans: [] }; }

  function rawPlans(date) {
    var data = read(PLAN_KEY, null);
    if (!data || data.date !== date || !Array.isArray(data.plans)) return null;
    return data.plans;
  }

  function normalize(t) {
    var start = toMinutes(t.startTime);
    var end = toMinutes(t.endTime);
    if (end <= start) end = start + 30;
    var out = {
      id: t.id,
      name: t.name || '未命名任务',
      startTime: t.startTime || '',
      endTime: t.endTime || '',
      category: t.category || 'other',
      note: t.note || '',
      completed: !!t.completed,
      status: t.status || (t.completed ? 'done' : 'todo'),
      actualStart: t.actualStart || '',
      actualEnd: t.actualEnd || '',
      plannedMinutes: end - start,
      blockedReason: t.blockedReason || '',
      raw: t
    };
    var span = (t.actualStart && t.actualEnd)
      ? Math.max(0, toMinutes(t.actualEnd) - toMinutes(t.actualStart))
      : 0;
    out.actualMinutes = Number(t.actualMinutes) > 0 ? Number(t.actualMinutes)
      : (span > 0 ? span : (out.status === 'done' ? out.plannedMinutes : 0));
    var link = links()[t.id];
    if (link) { out.okrId = link.okrId; out.krIndex = link.krIndex; out.krTitle = link.krTitle; }
    return out;
  }

  function links() { return read(LINK_KEY, {}) || {}; }

  // 手动状态优先；没手动点过就按时间推导
  function effectiveStatus(task, nowMin) {
    if (task.status === 'done' || task.status === 'blocked') return task.status;
    var cur = (nowMin === undefined) ? nowMinutes() : nowMin;
    var start = toMinutes(task.startTime);
    var end = toMinutes(task.endTime);
    if (!task.startTime || !task.endTime) return task.status || 'todo';
    if (cur < start) return 'todo';
    if (cur <= end) return 'doing';
    // 时间过了还没完成 → 视为有阻碍
    return 'blocked';
  }

  function getTasks(date) {
    date = date || todayStr();
    var list = rawPlans(date);
    if (!list) return [];
    return list.map(normalize).map(function (t) {
      t.effective = effectiveStatus(t);
      return t;
    });
  }

  function findIndexById(date, id) {
    var list = rawPlans(date || todayStr());
    if (!list) return -1;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
    return -1;
  }

  function patchTask(id, patch, date) {
    date = date || todayStr();
    var list = rawPlans(date);
    if (!list) return false;
    var i = findIndexById(date, id);
    if (i < 0) return false;
    Object.keys(patch).forEach(function (k) { list[i][k] = patch[k]; });
    write(PLAN_KEY, { date: date, plans: list });
    emit({ id: id, task: normalize(list[i]) });
    return true;
  }

  // ---------- 状态操作 ----------
  function stamp() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function startTask(id, date) {
    return patchTask(id, {
      status: 'doing',
      actualStart: stamp(),
      actualEnd: '',
      completed: false,
      blockedReason: ''
    }, date);
  }

  function finishTask(id, date) {
    var list = rawPlans(date || todayStr());
    if (!list) return false;
    var i = findIndexById(date, id);
    if (i < 0) return false;
    var t = list[i];
    var start = t.actualStart || stamp();
    var elapsed = toMinutes(stamp()) - toMinutes(start);
    if (elapsed <= 0) elapsed = Math.max(1, toMinutes(t.endTime) - toMinutes(t.startTime));
    return patchTask(id, {
      status: 'done',
      completed: true,
      actualStart: start,
      actualEnd: stamp(),
      actualMinutes: elapsed,
      blockedReason: ''
    }, date);
  }

  function blockTask(id, reason, date) {
    return patchTask(id, {
      status: 'blocked',
      completed: false,
      blockedReason: reason || '没按计划完成'
    }, date);
  }

  function resetTask(id, date) {
    return patchTask(id, {
      status: 'todo', completed: false, actualStart: '', actualEnd: '', blockedReason: ''
    }, date);
  }

  // ---------- 与目标关联 ----------
  function linkTask(taskId, okrId, krIndex, krTitle) {
    var all = links();
    if (!okrId) delete all[taskId];
    else all[taskId] = { okrId: okrId, krIndex: (krIndex === undefined || krIndex === null) ? null : krIndex, krTitle: krTitle || '' };
    write(LINK_KEY, all);
    emit({ taskId: taskId, link: all[taskId] || null });
  }
  function getLink(taskId) { return links()[taskId] || null; }

  function okrs() {
    var data = read(OKR_KEY, []);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.okrs)) return data.okrs;
    return [];
  }
  function okrTitle(id) {
    var found = okrs().filter(function (o) { return o.id === id; })[0];
    return found ? found.title : '';
  }

  // 今天每个目标（含关键结果）的投入情况
  function okrContribution(date) {
    var map = {};
    getTasks(date).forEach(function (t) {
      if (!t.okrId) return;
      var m = map[t.okrId] || (map[t.okrId] = { okrId: t.okrId, title: okrTitle(t.okrId), minutes: 0, plannedMinutes: 0, tasks: [], done: 0 });
      var used = t.actualMinutes || 0;
      m.minutes += used;
      m.plannedMinutes += t.plannedMinutes;
      m.tasks.push({ id: t.id, name: t.name, minutes: used, plannedMinutes: t.plannedMinutes, status: t.effective, krIndex: t.krIndex, krTitle: t.krTitle });
      if (t.effective === 'done') m.done += 1;
    });
    return map;
  }

  // ---------- 当天使用记录（一日修行图的时间范围）----------
  function usageAll() { return read(USAGE_KEY, {}) || {}; }
  function usage(date) {
    date = date || todayStr();
    var all = usageAll();
    return all[date] || { first: '', last: '', visits: 0 };
  }
  function logVisit() {
    var date = todayStr();
    var all = usageAll();
    var u = all[date] || { first: '', last: '', visits: 0 };
    var t = stamp();
    if (!u.first) u.first = t;
    u.last = t;
    u.visits = (u.visits || 0) + 1;
    all[date] = u;
    write(USAGE_KEY, all);
    // 只保留最近 60 天
    var keys = Object.keys(all).sort();
    if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(function (k) { delete all[k]; });
    return u;
  }

  // 修行图的时间范围，优先级：手动记录（实际开始/结束）> 每日计划时间 > 网站使用时间
  function dayWindow(date) {
    date = date || todayStr();
    var u = usage(date);
    var list = getTasks(date);

    var manualStarts = [], manualEnds = [], planStarts = [], planEnds = [];
    list.forEach(function (t) {
      if (t.actualStart) manualStarts.push(toMinutes(t.actualStart));
      if (t.actualEnd) manualEnds.push(toMinutes(t.actualEnd));
      if (t.startTime) planStarts.push(toMinutes(t.startTime));
      if (t.endTime) planEnds.push(toMinutes(t.endTime));
    });

    var start, end, source;
    if (manualStarts.length && manualEnds.length) {
      start = Math.min.apply(null, manualStarts);
      end = Math.max.apply(null, manualEnds);
      source = 'manual';
    } else if (planStarts.length && planEnds.length) {
      start = Math.min.apply(null, planStarts);
      end = Math.max.apply(null, planEnds);
      source = 'plan';
    } else {
      start = u.first ? toMinutes(u.first) : 6 * 60;
      end = u.last ? toMinutes(u.last) : 23 * 60;
      source = 'usage';
    }
    // 网站使用时间作为兜底参考：比手动/计划更早或更晚时就扩一点
    if (u.first && source !== 'usage') start = Math.min(start, toMinutes(u.first));
    if (u.last && source !== 'usage') end = Math.max(end, toMinutes(u.last));

    if (end - start < 60) end = start + 60;
    return {
      start: start, end: end,
      first: u.first, last: u.last, visits: u.visits || 0,
      source: source,
      sourceText: source === 'manual' ? '按你记录的实际时间'
        : (source === 'plan' ? '按每日计划的时间' : '按网站使用时间')
    };
  }

  function fmtMinutes(m) {
    m = Math.max(0, Math.round(m || 0));
    if (m < 60) return m + ' 分钟';
    var h = Math.floor(m / 60), r = m % 60;
    return r ? (h + ' 小时 ' + r + ' 分钟') : (h + ' 小时');
  }

  function minutesToText(min) {
    min = Math.max(0, Math.round(min || 0));
    return pad(Math.floor(min / 60) % 24) + ':' + pad(min % 60);
  }

  function stats(date) {
    var tasks = getTasks(date);
    var s = { total: tasks.length, todo: 0, doing: 0, done: 0, blocked: 0, actualMinutes: 0, plannedMinutes: 0, tasks: tasks };
    tasks.forEach(function (t) {
      s[t.effective] = (s[t.effective] || 0) + 1;
      s.actualMinutes += (t.actualMinutes || 0);
      s.plannedMinutes += (t.plannedMinutes || 0);
    });
    return s;
  }

  // ---------- 每日快照：七日修行图 / 复盘趋势都读这里 ----------
  function snapshot(date) {
    date = date || todayStr();
    var s;
    try { s = stats(date); } catch (e) { return null; }
    if (!s || !s.total) return null;
    var all = read(HISTORY_KEY, {}) || {};
    all[date] = {
      total: s.total, done: s.done, doing: s.doing, blocked: s.blocked, todo: s.todo,
      actualMinutes: s.actualMinutes, plannedMinutes: s.plannedMinutes
    };
    var keys = Object.keys(all).sort();
    if (keys.length > 120) keys.slice(0, keys.length - 120).forEach(function (k) { delete all[k]; });
    write(HISTORY_KEY, all);
    return all[date];
  }

  // 最近 N 天（含今天）的真实完成情况
  function weekHistory(days) {
    days = days || 7;
    var all = read(HISTORY_KEY, {}) || {};
    var WEEK = ['日', '一', '二', '三', '四', '五', '六'];
    var out = [];
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var key = todayStr(d);
      var rec = all[key] || null;
      out.push({
        date: key,
        day: '周' + WEEK[d.getDay()],
        label: (d.getMonth() + 1) + '/' + d.getDate(),
        today: i === 0,
        hasData: !!rec,
        total: rec ? rec.total : 0,
        done: rec ? rec.done : 0,
        blocked: rec ? rec.blocked : 0,
        completion: (rec && rec.total) ? Math.round((rec.done / rec.total) * 100) : 0,
        focusMin: rec ? rec.actualMinutes : 0
      });
    }
    return out;
  }

  function currentTask(date, nowMin) {
    var cur = (nowMin === undefined) ? nowMinutes() : nowMin;
    var list = getTasks(date);
    var doing = list.filter(function (t) { return t.effective === 'doing'; });
    if (doing.length) return doing[0];
    var next = list.filter(function (t) { return toMinutes(t.startTime) > cur; })
      .sort(function (a, b) { return toMinutes(a.startTime) - toMinutes(b.startTime); })[0];
    if (next) return next;
    // 没有进行中也没有待开始的：把最近一个「有阻碍」的挑出来，方便重来
    var blocked = list.filter(function (t) { return t.effective === 'blocked'; })
      .sort(function (a, b) { return toMinutes(b.startTime) - toMinutes(a.startTime); })[0];
    return blocked || null;
  }

  global.XingxingTasks = {
    KEY: PLAN_KEY,
    today: todayStr,
    toMinutes: toMinutes,
    nowMinutes: nowMinutes,
    getTasks: getTasks,
    stats: stats,
    snapshot: snapshot,
    weekHistory: weekHistory,
    currentTask: currentTask,
    effectiveStatus: effectiveStatus,
    startTask: startTask,
    finishTask: finishTask,
    blockTask: blockTask,
    resetTask: resetTask,
    patchTask: patchTask,
    linkTask: linkTask,
    getLink: getLink,
    okrTitle: okrTitle,
    okrContribution: okrContribution,
    usage: usage,
    logVisit: logVisit,
    dayWindow: dayWindow,
    fmtMinutes: fmtMinutes,
    minutesToText: minutesToText,
    on: on,
    emit: emit,
    EVT: EVT
  };

  // 打开任意页面即记一次「今天用过产品」
  logVisit();
})(window);
