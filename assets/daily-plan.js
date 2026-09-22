/* ============================================
   每日计划 - 时间段任务 + 限时提醒
   ============================================ */

(function() {
  'use strict';

  var App = window.XingxingCommon || window.App;
  var STORAGE_KEY = 'xingxing_daily_plan';
  var RINGTONE_KEY = 'xingxing_ringtone_custom';
  var CUSTOM_RINGTONE_KEY = 'xingxing_custom_ringtone';

  var plans = [];
  var currentEditId = null;
  var selectedCategory = 'study';
  var selectedRingtone = 'bell';
  var alarmCheckInterval = null;
  var alarmAudio = null;
  var currentAlarmPlan = null;
  var customRingtoneData = null;

  // ========== 初始化 ==========
  function init() {
    loadPlans();
    renderDate();
    renderTimeline();
    updateSummary();
    updateAlarmStatus();
    startAlarmChecker();
    updateNowLine();
    setInterval(updateNowLine, 60000);
  }

  // ========== 日期显示 ==========
  function renderDate() {
    var now = new Date();
    var weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    var dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 · 星期' + weekdays[now.getDay()];
    var el = document.getElementById('planDate');
    if (el) el.textContent = dateStr;
  }

  // ========== 数据加载与保存 ==========
  function loadPlans() {
    var today = getTodayStr();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data.date === today && Array.isArray(data.plans)) {
          plans = data.plans;
          return;
        }
      }
    } catch (e) {}
    plans = [];
    savePlans();
  }

  function savePlans() {
    var today = getTodayStr();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: today,
      plans: plans
    }));
  }

  function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // ========== 渲染时间轴 ==========
  function renderTimeline() {
    var container = document.getElementById('timelineContainer');
    if (!container) return;

    if (plans.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <div class="empty-text">今日尚无计划</div>
          <div class="empty-hint">点击右上角「添加计划」开始规划你的一天</div>
        </div>
      `;
      return;
    }

    // 按开始时间排序
    var sortedPlans = [...plans].sort(function(a, b) {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();

    container.innerHTML = sortedPlans.map(function(plan) {
      var startMin = timeToMinutes(plan.startTime);
      var endMin = timeToMinutes(plan.endTime);
      var isCurrent = nowMinutes >= startMin && nowMinutes < endMin;
      var isCompleted = plan.completed || nowMinutes >= endMin;
      var progress = 0;
      if (isCurrent) {
        progress = Math.min(100, ((nowMinutes - startMin) / (endMin - startMin)) * 100);
      } else if (isCompleted) {
        progress = 100;
      }

      var catLabels = {
        study: '📖 学习',
        work: '💼 工作',
        exercise: '💪 运动',
        rest: '🌿 休息',
        other: '📝 其他'
      };

      var alarmTag = plan.alarmOn
        ? '<span class="plan-tag alarm-on">🔔 ' + getRingtoneLabel(plan.ringtone) + '</span>'
        : '';

      return `
        <div class="timeline-item ${isCurrent ? 'current' : ''} ${isCompleted && !isCurrent ? 'completed' : ''}" data-id="${plan.id}">
          <div class="timeline-time">
            ${plan.startTime}
            <span class="end-time">${plan.endTime}</span>
          </div>
          <div class="timeline-dot"></div>
          <div class="plan-header-row">
            <div class="plan-title">${escapeHtml(plan.name)}</div>
            <div class="plan-actions">
              <button class="plan-action-btn" onclick="DailyPlan.editPlan('${plan.id}')" title="编辑">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
              <button class="plan-action-btn danger" onclick="DailyPlan.deletePlan('${plan.id}')" title="删除">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="plan-meta">
            <span class="plan-tag ${plan.category}">${catLabels[plan.category] || '📝 其他'}</span>
            ${alarmTag}
            ${plan.note ? '<span class="plan-tag">📝 ' + escapeHtml(plan.note).slice(0, 15) + '</span>' : ''}
          </div>
          ${isCurrent || isCompleted ? '<div class="plan-progress-bar"><div class="plan-progress-fill" style="width:' + progress + '%"></div></div>' : ''}
        </div>
      `;
    }).join('');
  }

  function timeToMinutes(timeStr) {
    var parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function getRingtoneLabel(ringtone) {
    var labels = { bell: '古钟', chime: '风铃', drum: '更鼓', bird: '鸟鸣', custom: '自定义' };
    return labels[ringtone] || '铃声';
  }

  // ========== 更新概览 ==========
  function updateSummary() {
    var totalEl = document.getElementById('totalTasks');
    var completedEl = document.getElementById('completedTasks');
    var alarmEl = document.getElementById('alarmCount');

    if (totalEl) totalEl.textContent = plans.length;
    if (completedEl) {
      var done = plans.filter(function(p) { return p.completed; }).length;
      completedEl.textContent = done;
    }
    if (alarmEl) {
      var nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      var pending = plans.filter(function(p) {
        return p.alarmOn && !p.alarmTriggered && timeToMinutes(p.startTime) > nowMin;
      }).length;
      alarmEl.textContent = pending;
    }
  }

  // ========== 更新闹钟状态显示 ==========
  function updateAlarmStatus() {
    var statusEl = document.getElementById('alarmStatus');
    var textEl = document.getElementById('alarmStatusText');
    if (!statusEl || !textEl) return;

    var hasActiveAlarm = plans.some(function(p) {
      return p.alarmOn && !p.alarmTriggered;
    });

    if (hasActiveAlarm) {
      statusEl.classList.add('active');
      textEl.textContent = '提醒开启';
    } else {
      statusEl.classList.remove('active');
      textEl.textContent = '提醒关闭';
    }
  }

  // ========== 更新"现在"时间线位置 ==========
  function updateNowLine() {
    var container = document.getElementById('timelineContainer');
    if (!container || plans.length === 0) return;

    // 移除旧的
    var oldLine = container.querySelector('.timeline-now-line');
    if (oldLine) oldLine.remove();

    // 计算位置
    var sortedPlans = [...plans].sort(function(a, b) {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var firstStart = timeToMinutes(sortedPlans[0].startTime);
    var lastEnd = timeToMinutes(sortedPlans[sortedPlans.length - 1].endTime);

    // 如果当前时间在计划范围内，显示线
    if (nowMin >= firstStart && nowMin <= lastEnd) {
      var line = document.createElement('div');
      line.className = 'timeline-now-line';
      container.appendChild(line);
    }
  }

  // ========== 添加/编辑计划弹窗 ==========
  function openAddPlanModal() {
    currentEditId = null;
    document.getElementById('planModalTitle').textContent = '添加计划';
    document.getElementById('planName').value = '';

    // 默认时间：下一个整点
    var now = new Date();
    var nextHour = now.getHours() + 1;
    if (nextHour > 23) nextHour = 23;
    var startTime = String(nextHour).padStart(2, '0') + ':00';
    var endTime = String(Math.min(nextHour + 1, 23)).padStart(2, '0') + ':00';

    document.getElementById('planStartTime').value = startTime;
    document.getElementById('planEndTime').value = endTime;
    document.getElementById('planNote').value = '';
    document.getElementById('alarmToggle').checked = true;

    // 重置分类
    selectedCategory = 'study';
    updateCategorySelection();

    // 重置铃声
    selectedRingtone = 'bell';
    updateRingtoneSelection();
    toggleRingtoneSelectorUI(true);

    document.getElementById('planModal').classList.add('show');
  }

  function editPlan(id) {
    var plan = plans.find(function(p) { return p.id === id; });
    if (!plan) return;

    currentEditId = id;
    document.getElementById('planModalTitle').textContent = '编辑计划';
    document.getElementById('planName').value = plan.name;
    document.getElementById('planStartTime').value = plan.startTime;
    document.getElementById('planEndTime').value = plan.endTime;
    document.getElementById('planNote').value = plan.note || '';
    document.getElementById('alarmToggle').checked = plan.alarmOn;

    selectedCategory = plan.category;
    updateCategorySelection();

    selectedRingtone = plan.ringtone || 'bell';
    updateRingtoneSelection();
    toggleRingtoneSelectorUI(plan.alarmOn);

    document.getElementById('planModal').classList.add('show');
  }

  function closePlanModal() {
    document.getElementById('planModal').classList.remove('show');
    currentEditId = null;
  }

  function selectCategory(el) {
    selectedCategory = el.dataset.cat;
    updateCategorySelection();
  }

  function updateCategorySelection() {
    document.querySelectorAll('#categoryTags .category-tag').forEach(function(tag) {
      tag.classList.toggle('active', tag.dataset.cat === selectedCategory);
    });
  }

  function selectRingtone(el) {
    selectedRingtone = el.dataset.ring;
    updateRingtoneSelection();
    // 试听
    playRingtonePreview(selectedRingtone);
  }

  function updateRingtoneSelection() {
    document.querySelectorAll('#ringtoneOptions .ringtone-option').forEach(function(opt) {
      if (opt.classList.contains('custom')) return;
      opt.classList.toggle('active', opt.dataset.ring === selectedRingtone);
    });
  }

  function toggleRingtoneSelector() {
    var checked = document.getElementById('alarmToggle').checked;
    toggleRingtoneSelectorUI(checked);
  }

  function toggleRingtoneSelectorUI(show) {
    var selector = document.getElementById('ringtoneSelector');
    if (selector) {
      selector.classList.toggle('show', show);
    }
  }

  // ========== 自定义铃声上传 ==========
  function uploadCustomRingtone() {
    document.getElementById('customRingtoneInput').click();
  }

  function handleCustomRingtone(event) {
    var file = event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      customRingtoneData = e.target.result;
      localStorage.setItem(CUSTOM_RINGTONE_KEY, customRingtoneData);
      selectedRingtone = 'custom';
      updateRingtoneSelection();

      // 添加自定义选项到列表
      var options = document.getElementById('ringtoneOptions');
      var customOpt = options.querySelector('.ringtone-option.custom');
      customOpt.classList.add('active');
      customOpt.textContent = '🎵 自定义铃声';

      if (App && App.showToast) {
        App.showToast('自定义铃声已设置', 'success', 2000);
      }
    };
    reader.readAsDataURL(file);
  }

  // ========== 保存计划 ==========
  function savePlan() {
    var name = document.getElementById('planName').value.trim();
    var startTime = document.getElementById('planStartTime').value;
    var endTime = document.getElementById('planEndTime').value;
    var note = document.getElementById('planNote').value.trim();
    var alarmOn = document.getElementById('alarmToggle').checked;

    if (!name) {
      if (App && App.showToast) App.showToast('请输入任务名称', 'warning', 2000);
      return;
    }
    if (!startTime || !endTime) {
      if (App && App.showToast) App.showToast('请设置开始和结束时间', 'warning', 2000);
      return;
    }
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      if (App && App.showToast) App.showToast('结束时间需晚于开始时间', 'warning', 2000);
      return;
    }

    if (currentEditId) {
      // 编辑模式
      var idx = plans.findIndex(function(p) { return p.id === currentEditId; });
      if (idx >= 0) {
        plans[idx].name = name;
        plans[idx].startTime = startTime;
        plans[idx].endTime = endTime;
        plans[idx].category = selectedCategory;
        plans[idx].note = note;
        plans[idx].alarmOn = alarmOn;
        plans[idx].ringtone = selectedRingtone;
        // 如果修改了时间，重置触发状态
        plans[idx].alarmTriggered = false;
      }
    } else {
      // 新增模式
      plans.push({
        id: 'plan_' + Date.now(),
        name: name,
        startTime: startTime,
        endTime: endTime,
        category: selectedCategory,
        note: note,
        alarmOn: alarmOn,
        ringtone: selectedRingtone,
        completed: false,
        alarmTriggered: false
      });
    }

    savePlans();
    renderTimeline();
    updateSummary();
    updateAlarmStatus();
    updateNowLine();
    closePlanModal();

    if (App && App.showToast) {
      App.showToast(currentEditId ? '计划已更新' : '计划已添加', 'success', 2000);
    }
  }

  // ========== 删除计划 ==========
  function deletePlan(id) {
    if (!confirm('确定要删除这个计划吗？')) return;
    plans = plans.filter(function(p) { return p.id !== id; });
    savePlans();
    renderTimeline();
    updateSummary();
    updateAlarmStatus();
    updateNowLine();
    if (App && App.showToast) App.showToast('已删除', 'success', 1500);
  }

  // ========== 闹钟检查 ==========
  function startAlarmChecker() {
    // 每 30 秒检查一次
    alarmCheckInterval = setInterval(checkAlarms, 30000);
    // 立即检查一次
    setTimeout(checkAlarms, 1000);
  }

  function checkAlarms() {
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var nowSec = now.getSeconds();

    plans.forEach(function(plan) {
      if (!plan.alarmOn || plan.alarmTriggered) return;
      var startMin = timeToMinutes(plan.startTime);
      // 到点了（分钟匹配，秒数在 0-30 内触发一次）
      if (nowMin === startMin && nowSec < 30) {
        triggerAlarm(plan);
      }
    });
  }

  function triggerAlarm(plan) {
    plan.alarmTriggered = true;
    savePlans();
    currentAlarmPlan = plan;

    // 显示弹窗
    document.getElementById('alarmRingTime').textContent = plan.startTime;
    document.getElementById('alarmRingTask').textContent = plan.name;
    document.getElementById('alarmRingModal').classList.add('show');

    // 播放铃声
    playAlarmSound(plan.ringtone);

    // 更新状态
    updateSummary();
    updateAlarmStatus();

    // 浏览器通知（如果有权限）
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ 时间到！', {
        body: plan.name + ' 开始了',
        icon: ''
      });
    }
  }

  // ========== 铃声播放 ==========
  function playAlarmSound(ringtoneType) {
    stopAlarmSound();

    // 优先使用自定义铃声
    if (ringtoneType === 'custom') {
      var customData = localStorage.getItem(CUSTOM_RINGTONE_KEY);
      if (customData) {
        alarmAudio = new Audio(customData);
        alarmAudio.loop = true;
        alarmAudio.play().catch(function() {});
        return;
      }
    }

    // 使用 Web Audio API 生成不同铃声
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    alarmAudio = { ctx: audioCtx, oscillators: [], gainNode: null, stopped: false };

    var gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(audioCtx.destination);
    alarmAudio.gainNode = gainNode;

    var patterns = {
      bell: [800, 600, 800, 600],    // 古钟：低沉的咚-咚
      chime: [1200, 900, 1500, 1100], // 风铃：清脆的叮当
      drum: [200, 150, 200, 150],     // 更鼓：低沉的鼓声
      bird: [2000, 1500, 2500, 1800]  // 鸟鸣：高音啾啾
    };

    var freqs = patterns[ringtoneType] || patterns.bell;
    var i = 0;

    function playNext() {
      if (alarmAudio.stopped) return;
      var osc = audioCtx.createOscillator();
      osc.type = ringtoneType === 'drum' ? 'sine' : ringtoneType === 'bird' ? 'triangle' : 'sine';
      osc.frequency.value = freqs[i % freqs.length];
      osc.connect(gainNode);
      osc.start();

      // 包络
      var now = audioCtx.currentTime;
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.stop(now + 0.5);
      alarmAudio.oscillators.push(osc);

      i++;
      setTimeout(playNext, 600);
    }

    playNext();
  }

  function playRingtonePreview(ringtoneType) {
    // 简短试听（1.5秒）
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.2;
    gainNode.connect(audioCtx.destination);

    var patterns = {
      bell: [800, 600],
      chime: [1200, 900],
      drum: [200, 150],
      bird: [2000, 1500]
    };

    var freqs = patterns[ringtoneType] || patterns.bell;

    freqs.forEach(function(freq, idx) {
      setTimeout(function() {
        var osc = audioCtx.createOscillator();
        osc.type = ringtoneType === 'drum' ? 'sine' : 'sine';
        osc.frequency.value = freq;
        osc.connect(gainNode);
        var now = audioCtx.currentTime;
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.35);
      }, idx * 300);
    });
  }

  function stopAlarmSound() {
    if (alarmAudio) {
      if (alarmAudio instanceof Audio) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
      } else if (alarmAudio.ctx) {
        alarmAudio.stopped = true;
        try {
          alarmAudio.gainNode.gain.setValueAtTime(0, alarmAudio.ctx.currentTime);
          alarmAudio.oscillators.forEach(function(o) {
            try { o.stop(); } catch (e) {}
          });
        } catch (e) {}
      }
      alarmAudio = null;
    }
  }

  // ========== 闹钟操作 ==========
  function stopAlarm() {
    stopAlarmSound();
    document.getElementById('alarmRingModal').classList.remove('show');
    currentAlarmPlan = null;
    renderTimeline();
  }

  function snoozeAlarm() {
    stopAlarmSound();
    document.getElementById('alarmRingModal').classList.remove('show');

    // 5 分钟后再提醒
    if (currentAlarmPlan) {
      currentAlarmPlan.alarmTriggered = false;
      // 调整开始时间为 5 分钟后
      var now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      currentAlarmPlan.startTime = String(now.getHours()).padStart(2, '0') + ':' +
                                    String(now.getMinutes()).padStart(2, '0');
      savePlans();
      renderTimeline();
      updateSummary();
      updateAlarmStatus();

      if (App && App.showToast) {
        App.showToast('5 分钟后再提醒', 'info', 2000);
      }
    }
    currentAlarmPlan = null;
  }

  // ========== 请求通知权限 ==========
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // ========== 页面可见性变化时刷新 ==========
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      loadPlans();
      renderTimeline();
      updateSummary();
      updateAlarmStatus();
      updateNowLine();
    }
  });

  // ========== 暴露到全局 ==========
  window.DailyPlan = {
    init: init,
    openAddPlanModal: openAddPlanModal,
    editPlan: editPlan,
    deletePlan: deletePlan,
    closePlanModal: closePlanModal,
    savePlan: savePlan,
    selectCategory: selectCategory,
    selectRingtone: selectRingtone,
    toggleRingtoneSelector: toggleRingtoneSelector,
    uploadCustomRingtone: uploadCustomRingtone,
    handleCustomRingtone: handleCustomRingtone,
    stopAlarm: stopAlarm,
    snoozeAlarm: snoozeAlarm
  };

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
      requestNotificationPermission();
    });
  } else {
    init();
    requestNotificationPermission();
  }

})();
