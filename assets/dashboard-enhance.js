/* ============================================
   Dashboard Enhance - 首页交互增强
   - 精气神四环点击详情
   - 青蛙任务完成/编辑
   - 内外耗事件增删
   - 今日重点攻克模块
   - 事件驱动实时更新
   ============================================ */

(function() {
  'use strict';

  const App = window.App || window.XingxingCommon;
  if (!App) { console.error('App not found'); return; }

  const EV = App.EVENTS;

  // ========== 数字动画（数值过渡） ==========
  function animateNumber(el, from, to, duration) {
    duration = duration || 500;
    const startTime = performance.now();
    const diff = to - from;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + diff * eased);
      el.textContent = current + '%';
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function animateRing(circleEl, fromPercent, toPercent, duration) {
    duration = duration || 600;
    const radius = parseFloat(circleEl.getAttribute('r')) || 50;
    const circumference = 2 * Math.PI * radius;
    const startTime = performance.now();
    const diff = toPercent - fromPercent;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentPercent = fromPercent + diff * eased;
      const offset = circumference - (currentPercent / 100) * circumference;
      circleEl.style.strokeDashoffset = offset;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  // ========== 更新四环显示 ==========
  function updateFourRings() {
    const energy = App.getEnergy();
    const state = App.getState();
    const mental = App.getMental();
    const physical = App.getPhysical();

    // 精力环
    updateRing('energy', energy);
    // 状态环
    updateRing('state', state);
    // 精神环
    updateRing('mental', mental);
    // 身体素质环
    updateRing('physical', physical);

    // 更新鼓励语
    updateEncouragement(energy, state, mental);
  }

  function updateRing(type, value) {
    const valueEl = document.getElementById(type + 'Value4');
    const levelEl = document.getElementById(type + 'Level4');
    const ringEl = document.getElementById(type + 'OuterRing4');

    if (valueEl) {
      const oldVal = parseInt(valueEl.textContent) || 0;
      animateNumber(valueEl, oldVal, value, 500);
    }
    if (ringEl) {
      const radius = parseFloat(ringEl.getAttribute('r')) || 50;
      const circumference = 2 * Math.PI * radius;
      const oldOffset = parseFloat(ringEl.getAttribute('stroke-dashoffset')) || circumference;
      const oldPercent = Math.round((1 - oldOffset / circumference) * 100);
      animateRing(ringEl, oldPercent, value, 600);
    }
    if (levelEl) {
      let levelInfo;
      switch(type) {
        case 'energy': levelInfo = App.getEnergyLevel(value); break;
        case 'state': levelInfo = App.getStateLevel(value); break;
        case 'mental': levelInfo = App.getMentalLevel(value); break;
        case 'physical': levelInfo = App.getPhysicalLevel(value); break;
      }
      if (levelInfo) levelEl.textContent = levelInfo.text;
    }
  }

  function updateEncouragement(energy, state, mental) {
    const textEl = document.getElementById('encouragementText');
    if (!textEl) return;

    let msg = '';
    const avg = (energy + state + mental) / 3;

    if (avg >= 80) {
      msg = '精气神上佳，适合攻克难题。';
    } else if (avg >= 60) {
      if (energy < 50) {
        msg = '精力偏低，先充充电再继续。';
      } else if (state < 50) {
        msg = '状态一般，做点让自己开心的事。';
      } else if (mental < 50) {
        msg = '精神有些波动，深呼吸，慢慢来。';
      } else {
        msg = '平平常常也是福。不着急，慢慢走。';
      }
    } else if (avg >= 40) {
      msg = '今天比较消耗，记得给自己留点时间。';
    } else {
      msg = '状态不太好，别硬撑，休息也是修行。';
    }

    textEl.textContent = msg;
  }

  // ========== 四环详情弹窗 ==========
  function openRingDetail(type) {
    const modal = document.getElementById('ringDetailModal');
    if (!modal) return;

    const titleEl = document.getElementById('ringDetailTitle');
    const valueEl = document.getElementById('ringDetailValue');
    const levelEl = document.getElementById('ringDetailLevel');
    const changeEl = document.getElementById('ringDetailChange');
    const factorsEl = document.getElementById('ringDetailFactors');
    const descEl = document.getElementById('ringDetailDesc');

    let value, levelInfo, title, desc, factors = [];

    switch(type) {
      case 'energy':
        value = App.getEnergy();
        levelInfo = App.getEnergyLevel(value);
        title = '精力 · 金';
        desc = '精力是你今天的物理能量。睡眠、运动、饮食都会影响它。';
        factors = getEnergyFactors();
        break;
      case 'state':
        value = App.getState();
        levelInfo = App.getStateLevel(value);
        title = '状态 · 朱砂';
        desc = '状态是你的情绪和心理能量。成就感、社交、心情都会影响它。';
        factors = getStateFactors();
        break;
      case 'mental':
        value = App.getMental();
        levelInfo = App.getMentalLevel(value);
        title = '精神 · 石青';
        desc = '精神健康值受内外耗和充电恢复的综合影响。减少消耗、主动充电，它就会回升。';
        factors = getMentalFactors();
        break;
      case 'physical':
        value = App.getPhysical();
        levelInfo = App.getPhysicalLevel(value);
        title = '身体素质 · 翠绿';
        desc = '身体素质是你的体能底子。规律运动、充足睡眠能让它稳步提升。';
        factors = getPhysicalFactors();
        break;
    }

    if (titleEl) titleEl.textContent = title;
    if (valueEl) valueEl.textContent = value + '%';
    if (levelEl) {
      levelEl.textContent = levelInfo.text;
      levelEl.className = 'ring-detail-level level-' + levelInfo.level;
    }
    if (descEl) descEl.textContent = desc;

    // 今日变化
    const todayData = getTodayChange(type);
    if (changeEl) {
      if (todayData.change > 0) {
        changeEl.innerHTML = '<span class="change-positive">今日 +' + todayData.change + '</span>';
      } else if (todayData.change < 0) {
        changeEl.innerHTML = '<span class="change-negative">今日 ' + todayData.change + '</span>';
      } else {
        changeEl.innerHTML = '<span class="change-neutral">今日持平</span>';
      }
    }

    // 影响因素
    if (factorsEl) {
      factorsEl.innerHTML = factors.map(f => `
        <div class="factor-item">
          <span class="factor-icon">${f.icon}</span>
          <span class="factor-name">${f.name}</span>
          <span class="factor-impact ${f.value > 0 ? 'positive' : f.value < 0 ? 'negative' : ''}">
            ${f.value > 0 ? '+' : ''}${f.value}
          </span>
        </div>
      `).join('');
    }

    modal.classList.add('show');
  }

  function closeRingDetail() {
    const modal = document.getElementById('ringDetailModal');
    if (modal) modal.classList.remove('show');
  }

  function getTodayChange(type) {
    // 简化：从当前值和初始值比较
    const sleepQuality = getSleepQualitySafe();
    let initial = 70;
    let current = 0;
    switch(type) {
      case 'energy':
        initial = calculateInitial(sleepQuality, 'energy');
        current = App.getEnergy();
        break;
      case 'state':
        initial = calculateInitial(sleepQuality, 'state');
        current = App.getState();
        break;
      case 'mental':
        initial = calculateInitial(sleepQuality, 'mental');
        current = App.getMental();
        break;
      case 'physical':
        initial = calculateInitial(sleepQuality, 'physical');
        current = App.getPhysical();
        break;
    }
    return { change: current - initial, initial, current };
  }

  function getSleepQualitySafe() {
    try {
      const settings = App.safeGet('xingxing_settings', {});
      return settings.sleepQuality || 'good';
    } catch (e) { return 'good'; }
  }

  function calculateInitial(sleepQuality, type) {
    const map = {
      energy: { excellent: 95, good: 85, fair: 70, poor: 55, insomnia: 35 },
      state: { excellent: 85, good: 75, fair: 65, poor: 50, insomnia: 35 },
      mental: { excellent: 90, good: 80, fair: 75, poor: 55, insomnia: 40 },
      physical: { excellent: 85, good: 75, fair: 65, poor: 50, insomnia: 40 },
    };
    return map[type] ? (map[type][sleepQuality] || 70) : 70;
  }

  function getEnergyFactors() {
    const factors = [];
    const frog = App.getFrogTask();
    if (frog.done) {
      const cost = -Math.round((frog.duration || 60) / 30 * 7.5);
      factors.push({ icon: '🐸', name: '青蛙任务', value: cost });
    }
    const charge = App.getTodayChargeSummary();
    if (charge.energyRecover !== 0) {
      factors.push({ icon: '🔋', name: '充电恢复', value: charge.energyRecover });
    }
    // 估算日常消耗
    const now = new Date();
    const hoursAwake = Math.max(0, (now.getHours() - 7) + now.getMinutes() / 60);
    const dailyDrain = -Math.round(hoursAwake * 3);
    factors.push({ icon: '⏰', name: '日常消耗', value: dailyDrain });

    const fitness = App.safeGet('xingxing_fitness_log', null);
    if (fitness && fitness.todayWorkout) {
      factors.push({ icon: '💪', name: '健身运动', value: -Math.round(fitness.duration / 60 * 10) });
    }
    return factors;
  }

  function getStateFactors() {
    const factors = [];
    const frog = App.getFrogTask();
    if (frog.done) factors.push({ icon: '🐸', name: '完成青蛙任务', value: 10 });
    const charge = App.getTodayChargeSummary();
    if (charge.stateRecover !== 0) {
      factors.push({ icon: '🔋', name: '充电提升', value: charge.stateRecover });
    }
    const drain = App.getDrainSummary();
    if (drain.internal > 0) {
      factors.push({ icon: '🫧', name: '内耗影响', value: -Math.round(drain.internal * 0.5) });
    }
    factors.push({ icon: '☀️', name: '基础状态', value: 0 });
    return factors;
  }

  function getMentalFactors() {
    const factors = [];
    const drain = App.getDrainSummary();
    if (drain.external > 0) {
      factors.push({ icon: '📡', name: '外耗事件', value: -drain.external });
    }
    if (drain.internal > 0) {
      factors.push({ icon: '🫧', name: '内耗事件', value: -drain.internal });
    }
    const charge = App.getTodayChargeSummary();
    if (charge.mentalRecover !== 0) {
      factors.push({ icon: '🧘', name: '充电精神恢复', value: charge.mentalRecover });
    }
    const sleepQuality = getSleepQualitySafe();
    const base = calculateInitial(sleepQuality, 'mental') - 80;
    factors.push({ icon: '😴', name: '睡眠质量', value: base });
    return factors;
  }

  function getPhysicalFactors() {
    const factors = [];
    const sleepQuality = getSleepQualitySafe();
    const base = calculateInitial(sleepQuality, 'physical') - 70;
    factors.push({ icon: '😴', name: '睡眠质量', value: base });

    const fitness = App.safeGet('xingxing_fitness_log', null);
    if (fitness && fitness.todayWorkout) {
      factors.push({ icon: '💪', name: '今日运动', value: 5 });
    }

    const yesterday = App.getYesterdayStr();
    const yFitness = App.safeGet('xingxing_daily_fitness_' + yesterday, null);
    if (yFitness && yFitness.todayWorkout) {
      factors.push({ icon: '📆', name: '昨日运动余效', value: 3 });
    }
    factors.push({ icon: '🏃', name: '基础体质', value: 65 });
    return factors;
  }

  // ========== 青蛙任务 ==========
  function renderFrogTask() {
    const task = App.getFrogTask();
    const miniTitle = document.querySelector('.frog-mini-title');
    const frogMiniCard = document.getElementById('frogMiniCard');
    if (frogMiniCard) {
      frogMiniCard.classList.toggle('frog-done', task.done);
    }
    if (miniTitle) {
      miniTitle.textContent = task.title;
      miniTitle.style.textDecoration = task.done ? 'line-through' : 'none';
      miniTitle.style.opacity = task.done ? '0.5' : '1';
    }

    // 迷你复选框
    const miniCheck = document.getElementById('frogMiniCheck');
    if (miniCheck) {
      miniCheck.checked = task.done;
    }

    // 检查是否有青蛙任务卡片（详细版）
    const frogCard = document.getElementById('frogTaskCard');
    if (frogCard) {
      const checkbox = frogCard.querySelector('.frog-checkbox');
      const titleEl = frogCard.querySelector('.frog-title');
      const durationEl = frogCard.querySelector('.frog-duration');
      const statusEl = frogCard.querySelector('.frog-status');

      if (titleEl) titleEl.textContent = task.title;
      if (durationEl) durationEl.textContent = '预计 ' + task.duration + ' 分钟';
      if (checkbox) {
        checkbox.checked = task.done;
        checkbox.classList.toggle('checked', task.done);
      }
      if (titleEl) {
        titleEl.style.textDecoration = task.done ? 'line-through' : 'none';
        titleEl.style.opacity = task.done ? '0.5' : '1';
      }
      if (statusEl) {
        statusEl.textContent = task.done ? '已完成 ✓' : '待完成';
        statusEl.className = 'frog-status ' + (task.done ? 'done' : 'pending');
      }
    }
  }

  function toggleFrogTask() {
    const task = App.getFrogTask();
    if (task.done) {
      App.uncompleteFrogTask();
    } else {
      App.completeFrogTask();
    }
    renderFrogTask();
    updateFourRings();
    updatePointsDisplay();
  }

  function openFrogEditor() {
    const task = App.getFrogTask();
    const modal = document.getElementById('frogEditorModal');
    if (!modal) return;

    document.getElementById('frogEditorTitle').value = task.title;
    document.getElementById('frogEditorDuration').value = task.duration;
    // 设置时长按钮选中态
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.duration) === task.duration);
    });

    modal.classList.add('show');
  }

  function saveFrogEditor() {
    const title = document.getElementById('frogEditorTitle').value.trim();
    const duration = parseInt(document.getElementById('frogEditorDuration').value) || 60;

    if (!title) {
      App.showToast('请输入青蛙任务内容', 'warning', 2000);
      return;
    }

    App.saveFrogTask({ title, duration });
    renderFrogTask();
    closeFrogEditor();
    App.showToast('青蛙任务已更新', 'success', 2000);
  }

  function closeFrogEditor() {
    const modal = document.getElementById('frogEditorModal');
    if (modal) modal.classList.remove('show');
  }

  function selectDuration(minutes) {
    document.getElementById('frogEditorDuration').value = minutes;
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.duration) === minutes);
    });
  }

  // ========== 内外耗事件渲染 ==========
  function renderDrainEvents() {
    const data = App.getDrainEvents();
    const summary = App.getDrainSummary();

    // 外耗事件
    const externalList = document.getElementById('externalDrainEvents');
    const internalList = document.getElementById('internalDrainEvents');

    if (externalList) {
      const externalEvents = data.events.filter(e => e.type === 'external');
      externalList.innerHTML = externalEvents.map(ev => renderDrainEventItem(ev)).join('');
    }

    if (internalList) {
      const internalEvents = data.events.filter(e => e.type === 'internal');
      internalList.innerHTML = internalEvents.map(ev => renderDrainEventItem(ev)).join('');
    }

    // 更新概览
    const externalVal = document.getElementById('externalDrainValue');
    const internalVal = document.getElementById('internalDrainValue');
    const mentalVal = document.getElementById('mentalHealthValue');
    const mentalLevel = document.getElementById('mentalHealthLevel');

    if (externalVal) externalVal.textContent = summary.external + '%';
    if (internalVal) internalVal.textContent = summary.internal + '%';

    const mental = App.getMental();
    if (mentalVal) mentalVal.textContent = Math.round(mental) + '%';
    if (mentalLevel) mentalLevel.textContent = App.getMentalLevel(mental).text;

    // 更新总耗损汇总
    updateDrainTotalSummary(summary);
  }

  function renderDrainEventItem(ev) {
    const absImpact = Math.abs(ev.impact);
    const percent = Math.min(100, absImpact * 3);
    const severityLabel = {
      mild: '轻微', moderate: '中度', heavy: '重度'
    }[ev.severity] || '中度';

    return `
      <div class="drain-event-item" data-id="${ev.id}">
        <div class="drain-event-top">
          <span class="drain-event-icon">${ev.icon}</span>
          <span class="drain-event-name">${ev.name}</span>
          ${ev.duration ? '<span class="drain-event-meta">' + ev.duration + '</span>' : ''}
          <span class="drain-event-severity ${ev.severity}">${severityLabel}</span>
          <button class="drain-event-delete" onclick="DashboardEnhance.removeDrainEvent('${ev.id}')" title="删除">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="drain-event-bottom">
          <div class="drain-event-bar-container">
            <div class="drain-event-bar ${ev.type}" style="width: ${percent}%"></div>
          </div>
          <span class="drain-event-impact negative">${ev.impact}<span class="drain-event-impact-percent">约占全天${percent}%</span></span>
        </div>
        ${ev.reason ? '<div class="drain-event-reason">' + ev.reason + '</div>' : ''}
      </div>
    `;
  }

  function updateDrainTotalSummary(summary) {
    const totalEl = document.getElementById('drainTotalValue');
    const barFill = document.getElementById('drainTotalBarFill');
    const detailEl = document.getElementById('drainTotalSummary');

    if (totalEl) totalEl.textContent = summary.total;
    if (barFill) {
      const pct = Math.min(100, summary.total);
      barFill.style.width = pct + '%';
    }

    // 更新明细
    const chargeSummary = App.getTodayChargeSummary();
    if (detailEl) {
      const detailContainer = detailEl.querySelector('.drain-total-detail');
      if (detailContainer) {
        detailContainer.innerHTML = `
          <span><span class="drain-total-dot external"></span>外耗 ${summary.external}</span>
          <span><span class="drain-total-dot internal"></span>内耗 ${summary.internal}</span>
          <span><span class="drain-total-dot recovery"></span>充电恢复 +${chargeSummary.mentalRecover}</span>
        `;
      }
    }

    // 更新建议
    const suggestionEl = document.getElementById('drainSuggestion');
    if (suggestionEl) {
      if (summary.total >= 50) {
        suggestionEl.textContent = '今日消耗较大，建议安排一次深度充电恢复精力。';
      } else if (summary.internal > summary.external) {
        suggestionEl.textContent = '内耗偏多，试试冥想或深呼吸来平静心绪。';
      } else if (summary.external > 0) {
        suggestionEl.textContent = '建议：把消息集中到固定时间点处理，能减少约 40% 外耗';
      } else {
        suggestionEl.textContent = '今天状态不错，继续保持节奏。';
      }
    }
  }

  // ========== 添加内外耗事件 ==========
  // ---- 内耗/外耗草稿自动保存 ----
  const DRAFT_KEY = 'xingxing_drain_draft';

  function loadDrainDraft(type) {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      if (draft.type === type) return draft;
      return null;
    } catch (e) { return null; }
  }

  function saveDrainDraft(type) {
    const draft = {
      type: type,
      name: document.getElementById('addDrainName').value,
      impact: document.getElementById('addDrainImpact').value,
      reason: document.getElementById('addDrainReason').value,
      icon: document.getElementById('drainPresetIcon').value
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function clearDrainDraft() {
    localStorage.removeItem(DRAFT_KEY);
    document.getElementById('addDrainName').value = '';
    document.getElementById('addDrainImpact').value = 5;
    document.getElementById('drainImpactValue').textContent = '5';
    document.getElementById('addDrainReason').value = '';
    const type = document.getElementById('addDrainType')?.value || 'internal';
    document.getElementById('drainPresetIcon').value = type === 'external' ? '📱' : '😔';
  }

  function clearDrainDraftAndReset() {
    clearDrainDraft();
    App.showToast('已清空', 'success', 1500);
  }

  function openAddDrainModal(type) {
    const modal = document.getElementById('addDrainModal');
    if (!modal) return;

    document.getElementById('addDrainType').value = type;

    // 先尝试恢复草稿，没有再清空
    const draft = loadDrainDraft(type);
    if (draft && (draft.name || draft.reason)) {
      document.getElementById('addDrainName').value = draft.name || '';
      document.getElementById('addDrainImpact').value = draft.impact || 5;
      document.getElementById('drainImpactValue').textContent = draft.impact || '5';
      document.getElementById('addDrainReason').value = draft.reason || '';
      document.getElementById('drainPresetIcon').value = draft.icon || (type === 'external' ? '📱' : '😔');
    } else {
      document.getElementById('addDrainName').value = '';
      document.getElementById('addDrainImpact').value = 5;
      document.getElementById('drainImpactValue').textContent = '5';
      document.getElementById('addDrainReason').value = '';
    }

    // 设置类型标题
    const titleEl = document.getElementById('addDrainModalTitle');
    if (titleEl) titleEl.textContent = type === 'external' ? '添加外耗事件' : '添加内耗事件';

    // 预设选项
    const presetsEl = document.getElementById('drainPresets');
    if (presetsEl) {
      const presets = type === 'external'
        ? [{ name: '刷手机', icon: '📱', impact: 8 },
           { name: '零碎消息打断', icon: '📧', impact: 5 },
           { name: '任务频繁切换', icon: '🔀', impact: 6 },
           { name: '无效会议', icon: '💼', impact: 7 },
           { name: '环境嘈杂', icon: '🔊', impact: 4 }]
        : [{ name: '焦虑担心', icon: '😰', impact: 10 },
           { name: '反复纠结', icon: '🤔', impact: 7 },
           { name: '自我怀疑', icon: '😔', impact: 8 },
           { name: '拖延内疚', icon: '⏰', impact: 6 },
           { name: '完美主义', icon: '✨', impact: 5 }];

      presetsEl.innerHTML = presets.map(p => `
        <span class="drain-preset-tag" onclick="DashboardEnhance.selectDrainPreset('${p.name}', '${p.icon}', ${p.impact})">
          ${p.icon} ${p.name}
        </span>
      `).join('');
    }

    modal.classList.add('show');

    // 绑定自动保存（输入时实时存草稿）
    const nameInput = document.getElementById('addDrainName');
    const impactInput = document.getElementById('addDrainImpact');
    const reasonInput = document.getElementById('addDrainReason');
    if (nameInput) nameInput.oninput = () => saveDrainDraft(type);
    if (impactInput) impactInput.oninput = () => {
      document.getElementById('drainImpactValue').textContent = impactInput.value;
      saveDrainDraft(type);
    };
    if (reasonInput) reasonInput.oninput = () => saveDrainDraft(type);
  }

  function selectDrainPreset(name, icon, impact) {
    document.getElementById('addDrainName').value = name;
    document.getElementById('addDrainImpact').value = impact;
    document.getElementById('drainPresetIcon').value = icon;
    const type = document.getElementById('addDrainType').value;
    saveDrainDraft(type);
  }

  function saveDrainEvent() {
    const type = document.getElementById('addDrainType').value;
    const name = document.getElementById('addDrainName').value.trim();
    const impact = parseInt(document.getElementById('addDrainImpact').value) || 5;
    const reason = document.getElementById('addDrainReason').value.trim();
    const icon = document.getElementById('drainPresetIcon').value || (type === 'external' ? '📱' : '😔');

    if (!name) {
      App.showToast('请输入事件名称', 'warning', 2000);
      return;
    }

    let severity = 'moderate';
    if (impact <= 3) severity = 'mild';
    else if (impact >= 8) severity = 'heavy';

    App.addDrainEvent({ type, name, icon, impact, severity, reason });
    clearDrainDraft();
    closeAddDrainModal();
    renderDrainEvents();
    updateFourRings();
    App.showToast('已添加' + (type === 'external' ? '外耗' : '内耗') + '事件，精神-' + impact, 'warning', 2500);
  }

  function closeAddDrainModal() {
    const modal = document.getElementById('addDrainModal');
    if (modal) modal.classList.remove('show');
  }

  function removeDrainEvent(eventId) {
    const removed = App.removeDrainEvent(eventId);
    if (removed) {
      renderDrainEvents();
      updateFourRings();
      App.showToast('已删除，精神+' + Math.abs(removed.impact), 'success', 2000);
    }
  }

  // ========== 今日重点攻克模块 ==========
  function renderTodayFocusErrors() {
    const container = document.getElementById('todayFocusErrors');
    if (!container) return;

    const errors = App.getTodayFocusErrors();
    if (errors.length === 0) {
      container.innerHTML = `
        <div class="focus-empty">
          <span class="focus-empty-icon">🎯</span>
          <span class="focus-empty-text">暂无重点攻克目标</span>
          <span class="focus-empty-hint">错题本中添加 critical 级别的错题</span>
        </div>
      `;
      return;
    }

    container.innerHTML = errors.map(err => {
      const cat = getCategoryName(err.categoryId);
      return `
        <div class="focus-error-item" onclick="DashboardEnhance.goToErrorDetail('${err.id}')">
          <div class="focus-error-header">
            <span class="focus-error-badge ${err.status}">${err.status === 'critical' ? '重点' : '关注'}</span>
            <span class="focus-error-cat">${cat}</span>
          </div>
          <div class="focus-error-title">${err.title}</div>
          <div class="focus-error-footer">
            <span>错 ${err.errorCount} 次</span>
            <span>掌握度 ${err.masteryLevel}%</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function getCategoryName(categoryId) {
    const data = App.getErrorBookData();
    const cat = data.categories.find(c => c.id === categoryId);
    return cat ? (cat.icon || '') + ' ' + cat.name : '未分类';
  }

  function goToErrorDetail(errorId) {
    // 跳转到错题本并带上ID
    window.location.href = 'error-book.html?error=' + errorId;
  }

  // ========== 积分显示更新 ==========
  function updatePointsDisplay() {
    const points = App.getPoints();
    const streak = App.getStreak();

    const pointsNum = document.getElementById('topbarPoints');
    if (pointsNum) {
      const numEl = pointsNum.querySelector('.points-num');
      if (numEl) numEl.textContent = points;
    }

    const streakEl = document.getElementById('topbarStreak');
    if (streakEl) {
      const numEl = streakEl.querySelector('.streak-num');
      if (numEl) numEl.textContent = streak;
    }
  }

  // ========== 充电模块联动 ==========
  function updateChargeModule() {
    const summary = App.getTodayChargeSummary();
    const target = 6;

    const countEl = document.getElementById('chargeTodayCountNum');
    const barFill = document.getElementById('chargeTodayBarFill');
    const percentEl = document.getElementById('chargeTodayPercent');
    const hintEl = document.getElementById('chargeTodayHint');

    if (countEl) countEl.textContent = summary.count;
    if (barFill) barFill.style.width = Math.min(100, (summary.count / target) * 100) + '%';
    if (percentEl) percentEl.textContent = Math.round((summary.count / target) * 100) + '%';
    if (hintEl) {
      if (summary.count >= target) {
        hintEl.textContent = '今日充电目标达成！🎉';
      } else if (summary.count === 0) {
        hintEl.textContent = '还没充电呢，来一次吧';
      } else {
        hintEl.textContent = '再充 ' + (target - summary.count) + ' 次就达标啦';
      }
    }

    const energyRecoverEl = document.getElementById('chargeEnergyRecover');
    const stateRecoverEl = document.getElementById('chargeStateRecover');
    const mentalRecoverEl = document.getElementById('chargeMentalRecover');

    if (energyRecoverEl) energyRecoverEl.textContent = '+' + summary.energyRecover;
    if (stateRecoverEl) stateRecoverEl.textContent = '+' + summary.stateRecover;
    if (mentalRecoverEl) mentalRecoverEl.textContent = '+' + summary.mentalRecover;
  }

  // ========== 时间线当前位置实时更新 ==========
  function updateTimelineNowPosition() {
    const nowLine = document.getElementById('timelineNowLine');
    if (!nowLine) return;

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    // 时间线范围 6:00 - 23:00
    const startMin = 6 * 60;
    const endMin = 23 * 60;
    const totalMin = endMin - startMin;

    let percent;
    if (currentMin < startMin) percent = 0;
    else if (currentMin > endMin) percent = 100;
    else percent = ((currentMin - startMin) / totalMin) * 100;

    nowLine.style.left = percent + '%';
  }

  // ========== 事件订阅 ==========
  function subscribeEvents() {
    App.Events.on(EV.ENERGY_CHANGE, function(data) {
      updateRing('energy', data.newValue);
      updateEncouragement(App.getEnergy(), App.getState(), App.getMental());
    });

    App.Events.on(EV.STATE_CHANGE, function(data) {
      updateRing('state', data.newValue);
      updateEncouragement(App.getEnergy(), App.getState(), App.getMental());
    });

    App.Events.on(EV.MENTAL_CHANGE, function(data) {
      updateRing('mental', data.newValue);
      updateEncouragement(App.getEnergy(), App.getState(), App.getMental());
    });

    App.Events.on(EV.PHYSICAL_CHANGE, function(data) {
      updateRing('physical', data.newValue);
    });

    App.Events.on(EV.CHARGE_ADDED, function() {
      updateChargeModule();
    });

    App.Events.on(EV.DRAIN_UPDATED, function() {
      renderDrainEvents();
    });

    App.Events.on(EV.FROG_COMPLETED, function() {
      renderFrogTask();
    });

    App.Events.on(EV.ERROR_ADDED, function() {
      renderTodayFocusErrors();
    });

    App.Events.on(EV.ERROR_UPDATED, function() {
      renderTodayFocusErrors();
    });

    App.Events.on(EV.POINTS_CHANGE, function() {
      updatePointsDisplay();
    });
  }

  // ========== 充电系统集成（与现有充电系统联动） ==========
  function integrateChargeSystem() {
    // 检查现有充电系统是否存在
    if (typeof saveChargeRecord !== 'function') return;

    // 包装原有的保存函数
    const originalSave = saveChargeRecord;
    window.saveChargeRecord = function() {
      // 先调用原函数
      const result = originalSave.apply(this, arguments);

      // 从 DOM 读取充电后的值，同步到 App API
      const afterEnergy = parseInt(document.getElementById('chargeAfterEnergy')?.value) || App.getEnergy();
      const afterState = parseInt(document.getElementById('chargeAfterState')?.value) || App.getState();

      // 同步到 App（会触发事件）
      App.setEnergy(afterEnergy, '充电打卡');
      App.setState(afterState, '充电打卡');
      App.updateMental('充电恢复');

      // 更新显示
      updateFourRings();
      updateChargeModule();
      updatePointsDisplay();

      // 刷新推荐列表（如果原函数有刷新逻辑，这里再触发一次）
      if (typeof renderRecommendCards === 'function') {
        try { renderRecommendCards(); } catch (e) {}
      }

      return result;
    };

    // 包装快速充电按钮的函数
    if (typeof quickCharge === 'function') {
      const originalQuick = quickCharge;
      window.quickCharge = function() {
        const result = originalQuick.apply(this, arguments);
        // 延迟更新，等弹窗打开后数据已填充
        setTimeout(() => {
          const beforeEnergy = parseInt(document.getElementById('chargeBeforeEnergy')?.value);
          const beforeState = parseInt(document.getElementById('chargeBeforeState')?.value);
          if (!isNaN(beforeEnergy)) {
            // 确保弹窗中的值与当前状态一致
          }
        }, 100);
        return result;
      };
    }
  }

  // ========== 初始化示例数据 ==========
  function initSampleData() {
    const today = App.getTodayStr();

    // 内外耗事件：如果没有，添加示例数据
    const drainData = App.getDrainEvents();
    if (!drainData.events || drainData.events.length === 0) {
      const sampleEvents = [
        { type: 'external', name: '刷手机', icon: '📱', impact: 8, severity: 'moderate', duration: '40 min', reason: '学习间隙忍不住刷社交媒体' },
        { type: 'external', name: '零碎消息打断', icon: '📧', impact: 5, severity: 'mild', duration: '6 次', reason: '群消息不停弹出' },
        { type: 'internal', name: '担心雅思成绩', icon: '😰', impact: 10, severity: 'heavy', reason: '考试临近，有点焦虑' },
        { type: 'internal', name: '反复纠结小事', icon: '🤔', impact: 7, severity: 'moderate', reason: '决策疲劳，想太多' },
      ];
      sampleEvents.forEach(ev => {
        App.addDrainEvent(ev);
      });
    }

    // 青蛙任务：如果是默认值，设置一个有意义的
    const frog = App.getFrogTask();
    if (frog.title === '完成今日最重要的一件事') {
      App.saveFrogTask({ title: '完成雅思阅读 1 篇精读', duration: 60 });
    }
  }

  // ========== 初始化 ==========
  function init() {
    // 确保每日重置已检查
    try { App.checkDailyReset(); } catch (e) {}

    // 初始化示例数据（首次使用时）
    initSampleData();

    // 初始化数据
    updateFourRings();
    renderFrogTask();
    renderDrainEvents();
    renderTodayFocusErrors();
    updateChargeModule();
    updatePointsDisplay();
    updateTimelineNowPosition();

    // 四环点击事件
    document.querySelectorAll('.four-ring').forEach(ring => {
      ring.style.cursor = 'pointer';
      ring.addEventListener('click', function() {
        const type = this.dataset.type;
        openRingDetail(type);
      });
    });

    // 关闭弹窗 - 点击背景
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('detail-overlay')) {
        e.target.classList.remove('show');
      }
    });

    // 事件订阅
    subscribeEvents();

    // 集成充电系统
    integrateChargeSystem();

    // 跨页面数据同步（当其他页面修改数据时，当前页面自动刷新）
    window.addEventListener('storage', function(e) {
      // 精力/状态/精神变化
      if (e.key === 'xingxing_energy_state' ||
          e.key === 'xingxing_mood_state' ||
          e.key === 'xingxing_mental_health' ||
          e.key === 'xingxing_physical_health') {
        updateFourRings();
        updateChargeModule();
      }
      // 积分变化
      if (e.key === 'xingxing_points') {
        updatePointsDisplay();
      }
      // 错题本变化
      if (e.key === 'xingxing_error_book') {
        renderTodayFocusErrors();
      }
      // 青蛙任务变化
      if (e.key === 'xingxing_frog_task') {
        renderFrogTask();
      }
      // 内外耗变化
      if (e.key === 'xingxing_drain_events') {
        renderDrainEvents();
      }
      // 充电记录变化
      if (e.key === 'xingxing_charge_today') {
        updateChargeModule();
      }
    });

    // 页面可见性变化时刷新（从其他标签页切回来时）
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        updateFourRings();
        renderFrogTask();
        renderDrainEvents();
        renderTodayFocusErrors();
        updateChargeModule();
        updatePointsDisplay();
      }
    });

    // 每分钟更新时间线位置
    setInterval(updateTimelineNowPosition, 60000);

    console.log('Dashboard Enhance loaded');
  }

  // 暴露到全局
  window.DashboardEnhance = {
    init: init,
    openRingDetail: openRingDetail,
    closeRingDetail: closeRingDetail,
    toggleFrogTask: toggleFrogTask,
    openFrogEditor: openFrogEditor,
    saveFrogEditor: saveFrogEditor,
    closeFrogEditor: closeFrogEditor,
    selectDuration: selectDuration,
    openAddDrainModal: openAddDrainModal,
    saveDrainEvent: saveDrainEvent,
    closeAddDrainModal: closeAddDrainModal,
    removeDrainEvent: removeDrainEvent,
    selectDrainPreset: selectDrainPreset,
    clearDrainDraftAndReset: clearDrainDraftAndReset,
    goToErrorDetail: goToErrorDetail,
    renderTodayFocusErrors: renderTodayFocusErrors,
    updateFourRings: updateFourRings,
    renderDrainEvents: renderDrainEvents,
  };

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
