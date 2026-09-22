/* ============================================
   Daily OKR - 共享核心逻辑
   - 每日重置
   - 积分激励系统
   - 错题本联动工具
   - Toast 提示
   ============================================ */

(function(global) {
  'use strict';

  // ========== 工具函数 ==========
  function getTodayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function getYesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function safeGet(key, defaultValue) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('保存失败', key, e);
    }
  }

  // ========== 事件系统（发布订阅） ==========
  const AppEvents = {
    listeners: {},
    on(event, callback) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
    },
    off(event, callback) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    },
    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => {
          try { cb(data); } catch (e) { console.error('事件回调错误', event, e); }
        });
      }
    }
  };

  // 事件常量
  const EVENTS = {
    ENERGY_CHANGE: 'energy:change',
    STATE_CHANGE: 'state:change',
    MENTAL_CHANGE: 'mental:change',
    PHYSICAL_CHANGE: 'physical:change',
    CHARGE_ADDED: 'charge:added',
    ERROR_ADDED: 'error:added',
    ERROR_UPDATED: 'error:updated',
    REVIEW_DONE: 'review:done',
    POINTS_CHANGE: 'points:change',
    DAILY_RESET: 'daily:reset',
    FROG_COMPLETED: 'frog:completed',
    DRAIN_UPDATED: 'drain:updated',
  };

  // ========== 积分系统 ==========
  const POINTS_CONFIG = {
    REVIEW_COMPLETE: 20,        // 完成复盘
    ERROR_ADDED: 5,             // 添加一道错题
    ERROR_MASTERED: 30,         // 攻克一道错题
    PRACTICE_METHOD: 10,        // 实践改进方法一次
    FROG_TASK: 15,              // 完成青蛙任务
    IELTS_READING: 10,          // 雅思阅读打卡
    IELTS_LISTENING: 10,        // 雅思听力打卡
    FITNESS: 10,                // 健身打卡
    CHARGE: 2,                  // 充电打卡（每次）
    CHARGE_MAX_DAILY: 10,       // 充电每日上限
    SANXING_PER: 3,             // 三省记录每条
  };

  function getPoints() {
    return parseInt(localStorage.getItem('xingxing_points') || '0', 10);
  }

  function addPoints(amount, reason) {
    const current = getPoints();
    const newPoints = current + amount;
    localStorage.setItem('xingxing_points', String(newPoints));

    // 记录积分流水
    const log = safeGet('xingxing_points_log', []);
    log.unshift({
      date: getTodayStr(),
      time: new Date().toTimeString().slice(0, 5),
      amount: amount,
      reason: reason || '',
      total: newPoints
    });
    safeSet('xingxing_points_log', log.slice(0, 100));

    // 发射事件
    AppEvents.emit(EVENTS.POINTS_CHANGE, { amount, reason, total: newPoints });

    return newPoints;
  }

  function getStreak() {
    return parseInt(localStorage.getItem('xingxing_streak') || '0', 10);
  }

  function getLastStreak() {
    return parseInt(localStorage.getItem('xingxing_last_streak') || '0', 10);
  }

  // ========== 智能猜分类 ==========
  const CATEGORY_RULES = [
    { keywords: ['雅思', '学习', '阅读', '听力', '单词', '考试', '背书', '复习', '作业'], categoryId: 'c5', name: '学习方法' },
    { keywords: ['说话', '表达', '沟通', '逻辑', '演讲', '汇报', '发言', '嘴'], categoryId: 'c3', name: '表达沟通' },
    { keywords: ['拖延', '懒', '起不来', '习惯', '作息', '熬夜', '刷手机', '摸鱼'], categoryId: 'c2', name: '行为习惯' },
    { keywords: ['焦虑', '担心', '纠结', '内耗', '情绪', '生气', '难过', '抑郁', '压力', '紧张', '害怕', '恐惧'], categoryId: 'c4', name: '人际情绪' },
    { keywords: ['时间', '安排', '计划', '效率', '忙', '来不及', '做不完'], categoryId: 'c6', name: '时间管理' },
    { keywords: ['思维', '认知', '想法', '观念', '心态'], categoryId: 'c1', name: '思维认知' },
  ];

  function guessCategory(text) {
    if (!text) return { categoryId: 'c1', name: '思维认知' };
    const lowerText = text.toLowerCase();
    for (const rule of CATEGORY_RULES) {
      for (const kw of rule.keywords) {
        if (lowerText.includes(kw)) {
          return { categoryId: rule.categoryId, name: rule.name };
        }
      }
    }
    return { categoryId: 'c1', name: '思维认知' };
  }

  // ========== 错题本联动 ==========
  const ERROR_STORAGE_KEY = 'xingxing_error_book';

  function getErrorBookData() {
    return safeGet(ERROR_STORAGE_KEY, { categories: [], errorItems: [] });
  }

  function saveErrorBookData(data) {
    safeSet(ERROR_STORAGE_KEY, data);
  }

  function findSimilarError(title) {
    const data = getErrorBookData();
    if (!data.errorItems || data.errorItems.length === 0) return null;
    const normalizedTitle = title.trim().slice(0, 20).toLowerCase();
    return data.errorItems.find(item =>
      item.title.trim().slice(0, 20).toLowerCase() === normalizedTitle
    ) || null;
  }

  function addErrorToBook(errorData) {
    const data = getErrorBookData();
    const today = getTodayStr();

    const newError = {
      id: 'e' + Date.now(),
      categoryId: errorData.categoryId || 'c1',
      title: errorData.title,
      description: errorData.description || '',
      errorCount: 1,
      masteryLevel: 70,
      lastErrorDate: today,
      firstErrorDate: today,
      status: 'normal',
      tags: errorData.tags || [],
      errorReasons: errorData.errorReasons || ['待分析'],
      solutions: errorData.solutions || ['待思考'],
      history: [{
        date: today,
        context: errorData.context || '从复盘页加入',
        reflection: errorData.reflection || ''
      }],
      consecutiveSuccess: 0,
      practicedSolutions: [],
      addedFromReview: true,
      addedDate: today
    };

    data.errorItems.unshift(newError);
    saveErrorBookData(data);

    // 加积分
    addPoints(POINTS_CONFIG.ERROR_ADDED, '添加错题：' + errorData.title.slice(0, 10));

    // 更新统计
    const totalErrors = parseInt(localStorage.getItem('xingxing_total_errors') || '0', 10);
    localStorage.setItem('xingxing_total_errors', String(totalErrors + 1));

    // 记录今日新增
    const todayAdded = safeGet('xingxing_today_errors_' + today, []);
    todayAdded.push(newError.id);
    safeSet('xingxing_today_errors_' + today, todayAdded);

    return newError;
  }

  function incrementErrorCount(errorId, context, reflection) {
    const data = getErrorBookData();
    const item = data.errorItems.find(e => e.id === errorId);
    if (!item) return null;

    const today = getTodayStr();
    item.errorCount += 1;
    item.lastErrorDate = today;
    item.masteryLevel = Math.max(0, item.masteryLevel - 10);

    // 更新状态
    if (item.errorCount >= 3 && item.masteryLevel < 90) {
      item.status = 'critical';
    } else if (item.errorCount >= 2 && item.masteryLevel < 90) {
      item.status = 'warning';
    }

    // 添加历史记录
    item.history.unshift({
      date: today,
      context: context || '再次犯错',
      reflection: reflection || ''
    });

    item.consecutiveSuccess = 0;
    saveErrorBookData(data);
    return item;
  }

  function isTodayNewError(errorId) {
    const today = getTodayStr();
    const todayAdded = safeGet('xingxing_today_errors_' + today, []);
    return todayAdded.includes(errorId);
  }

  function getTodayNewErrorCount() {
    const today = getTodayStr();
    const todayAdded = safeGet('xingxing_today_errors_' + today, []);
    return todayAdded.length;
  }

  // ========== 复盘记录 ==========
  function saveReviewData(date, reviewData) {
    const key = 'xingxing_review_' + date;
    safeSet(key, reviewData);

    // 更新总复盘次数
    const total = parseInt(localStorage.getItem('xingxing_total_reviews') || '0', 10);
    localStorage.setItem('xingxing_total_reviews', String(total + 1));
  }

  function getReviewData(date) {
    return safeGet('xingxing_review_' + date, null);
  }

  function hasReviewOnDate(date) {
    return localStorage.getItem('xingxing_review_' + date) !== null;
  }

  // ========== 每日重置 ==========
  const LAST_ACTIVE_KEY = 'xingxing_last_active_date';

  function checkDailyReset() {
    const today = getTodayStr();
    const lastDate = localStorage.getItem(LAST_ACTIVE_KEY);

    if (lastDate !== today) {
      if (lastDate) {
        // 不是第一次使用，执行重置
        performDailyReset(lastDate, today);
      } else {
        // 第一次使用，初始化数据
        initFirstTime();
      }
      localStorage.setItem(LAST_ACTIVE_KEY, today);
      return true; // 是新的一天
    }
    return false; // 不是新的一天
  }

  function performDailyReset(yesterday, today) {
    // 1. 检查连续天数（基于昨天是否有复盘）
    updateStreak(yesterday);

    // 2. 归档昨天的数据
    archiveYesterdayData(yesterday);

    // 3. 重置今日数据
    resetTodayData(today);

    // 4. 显示新的一天提示
    showNewDayToast();
  }

  function updateStreak(yesterday) {
    const hadReview = hasReviewOnDate(yesterday);
    const streak = getStreak();

    if (hadReview) {
      const newStreak = streak + 1;
      const streakBonus = Math.min(newStreak * 2, 20);
      localStorage.setItem('xingxing_streak', String(newStreak));
      // 连续天数奖励（完成复盘的+20在提交复盘时单独给）
      if (streakBonus > 0) {
        addPoints(streakBonus, '连续' + newStreak + '天奖励');
      }
    } else {
      // 断了
      if (streak > 0) {
        localStorage.setItem('xingxing_streak', '0');
        localStorage.setItem('xingxing_last_streak', String(streak));
      }
    }
  }

  function archiveYesterdayData(yesterday) {
    // 将当日数据归档到历史
    // 精力状态
    const energyRaw = localStorage.getItem('xingxing_energy_state');
    if (energyRaw) {
      try {
        const energyData = JSON.parse(energyRaw);
        safeSet('xingxing_daily_energy_' + yesterday, energyData);
      } catch (e) {}
    }

    // 充电记录
    const chargeToday = localStorage.getItem('xingxing_charge_today');
    if (chargeToday) {
      try {
        const chargeData = JSON.parse(chargeToday);
        safeSet('xingxing_daily_charge_' + yesterday, chargeData);
      } catch (e) {}
    }

    // 青蛙任务
    const frogDone = localStorage.getItem('frog_task_done');
    if (frogDone) {
      safeSet('xingxing_daily_frog_' + yesterday, { done: frogDone === 'true' });
    }

    // 内外耗事件
    const drainEvents = localStorage.getItem('xingxing_drain_events');
    if (drainEvents) {
      try {
        const drainData = JSON.parse(drainEvents);
        safeSet('xingxing_daily_drain_' + yesterday, drainData);
      } catch (e) {}
    }

    // 运动记录
    const fitness = localStorage.getItem('xingxing_fitness_log');
    if (fitness) {
      try {
        const fitnessData = JSON.parse(fitness);
        safeSet('xingxing_daily_fitness_' + yesterday, fitnessData);
      } catch (e) {}
    }
  }

  function resetTodayData(today) {
    // 计算睡眠质量（默认良好，可从设置获取）
    const sleepQuality = getSleepQuality();

    // 1. 重置精力/状态
    const initialEnergy = calculateInitialEnergy(sleepQuality);
    const initialState = calculateInitialState(sleepQuality);

    // 更新精力状态存储（让页面自己读取时重置）
    // 各页面会在加载时检测日期变化，自行重置

    // 2. 清空今日充电记录
    safeSet('xingxing_charge_today', { count: 0, items: [] });

    // 3. 清空内外耗事件
    safeSet('xingxing_drain_events', { events: [], date: today });

    // 4. 重置青蛙任务
    localStorage.setItem('frog_task_done', 'false');

    // 5. 重置健身/运动状态
    safeSet('xingxing_fitness_log', {
      todayWorkout: false,
      workoutType: '',
      duration: 0,
      date: today
    });

    // 6. 计算今日初始精神健康值
    const mentalBase = calculateInitialMental(sleepQuality);
    safeSet('xingxing_mental_health', { value: mentalBase, date: today });

    // 7. 计算今日初始身体素质
    const physicalBase = calculateInitialPhysical(sleepQuality);
    safeSet('xingxing_physical_health', { value: physicalBase, date: today });
  }

  function getSleepQuality() {
    // 从设置获取，默认 'good'
    const settings = safeGet('xingxing_settings', {});
    return settings.sleepQuality || 'good';
  }

  function calculateInitialEnergy(sleepQuality) {
    switch (sleepQuality) {
      case 'excellent': return 95;
      case 'good': return 85;
      case 'fair': return 70;
      case 'poor': return 55;
      case 'insomnia': return 35;
      default: return 85;
    }
  }

  function calculateInitialState(sleepQuality) {
    // 默认比睡前状态低10%（起床启动期），睡眠好额外+5
    let base = 75;
    switch (sleepQuality) {
      case 'excellent': base = 85; break;
      case 'good': base = 75; break;
      case 'fair': base = 65; break;
      case 'poor': base = 50; break;
      case 'insomnia': base = 35; break;
    }
    return base;
  }

  function calculateInitialMental(sleepQuality) {
    switch (sleepQuality) {
      case 'excellent': return 90;
      case 'good': return 80;
      case 'fair': return 75;
      case 'poor': return 55;
      case 'insomnia': return 40;
      default: return 75;
    }
  }

  function calculateInitialPhysical(sleepQuality) {
    let base = 70;
    switch (sleepQuality) {
      case 'excellent': base = 85; break;
      case 'good': base = 75; break;
      case 'fair': base = 65; break;
      case 'poor': base = 50; break;
      case 'insomnia': return 40;
    }

    // 昨天运动了 +5
    const yesterday = getYesterdayStr();
    const yesterdayFitness = safeGet('xingxing_daily_fitness_' + yesterday, null);
    if (yesterdayFitness && yesterdayFitness.todayWorkout) {
      base += 5;
    }

    return Math.min(100, base);
  }

  function initFirstTime() {
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    // 积分与连续天数
    if (!localStorage.getItem('xingxing_points')) {
      localStorage.setItem('xingxing_points', '268');
    }
    if (!localStorage.getItem('xingxing_streak')) {
      localStorage.setItem('xingxing_streak', '3');
    }
    if (!localStorage.getItem('xingxing_total_reviews')) {
      localStorage.setItem('xingxing_total_reviews', '12');
    }
    if (!localStorage.getItem('xingxing_total_errors')) {
      localStorage.setItem('xingxing_total_errors', '6');
    }

    // 昨天有复盘记录（保持连续）
    if (!localStorage.getItem('xingxing_review_' + yesterday)) {
      safeSet('xingxing_review_' + yesterday, {
        sanxing: {
          1: '完成了雅思阅读三篇练习，正确率有所提升',
          2: '学到了一个新的解题方法：关键词定位法',
          3: '明天要练习听力Section 3'
        },
        mood: '😊',
        completed: true,
        timestamp: Date.now() - 86400000
      });
    }

    // 前几天的复盘记录（演示用）
    const dayBefore = (function() {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    })();
    if (!localStorage.getItem('xingxing_review_' + dayBefore)) {
      safeSet('xingxing_review_' + dayBefore, {
        sanxing: { 1: '复习了错题本', 2: '整理了学习笔记', 3: '继续保持' },
        mood: '😐',
        completed: true
      });
    }

    const threeDaysAgo = (function() {
      const d = new Date();
      d.setDate(d.getDate() - 3);
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    })();
    if (!localStorage.getItem('xingxing_review_' + threeDaysAgo)) {
      safeSet('xingxing_review_' + threeDaysAgo, {
        sanxing: { 1: '开始使用错题本', 2: '认识到自己的拖延问题', 3: '制定了改进计划' },
        mood: '😊',
        completed: true
      });
    }

    // 确保错题本中有一道今日新增的题
    ensureTodayNewError();
  }

  function ensureTodayNewError() {
    const today = getTodayStr();
    const data = getErrorBookData();

    // 检查是否已有今天的错题
    const hasTodayError = data.errorItems && data.errorItems.some(
      e => e.firstErrorDate === today || e.addedDate === today
    );

    if (!hasTodayError && data.errorItems && data.errorItems.length > 0) {
      // 添加一道今天的新错题
      const newError = {
        id: 'e_today_' + Date.now(),
        categoryId: 'c5',
        title: '雅思听力Section 3跟不上',
        description: '做听力时Section 3的选择题总是跟不上节奏，漏听关键信息',
        errorCount: 1,
        masteryLevel: 65,
        lastErrorDate: today,
        firstErrorDate: today,
        status: 'normal',
        tags: ['雅思', '听力', '技巧'],
        errorReasons: ['读题速度慢', '没有预判答案类型', '注意力容易分散'],
        solutions: ['提前读题，划出关键词', '边听边记笔记', '练习跟读提高反应速度'],
        history: [{
          date: today,
          context: '今天做剑17 Test 2听力，Section 3错了5道',
          reflection: '从复盘页发现并加入错题本'
        }],
        consecutiveSuccess: 0,
        practicedSolutions: [],
        addedFromReview: true,
        addedDate: today
      };

      data.errorItems.unshift(newError);
      saveErrorBookData(data);

      // 更新总数
      const totalErrors = parseInt(localStorage.getItem('xingxing_total_errors') || '0', 10);
      localStorage.setItem('xingxing_total_errors', String(totalErrors + 1));

      // 记录今日新增
      const todayAdded = safeGet('xingxing_today_errors_' + today, []);
      todayAdded.push(newError.id);
      safeSet('xingxing_today_errors_' + today, todayAdded);
    }
  }

  // ========== 今日重点攻克错题 ==========
  function getTodayFocusErrors() {
    const data = getErrorBookData();
    if (!data.errorItems || data.errorItems.length === 0) return [];

    // 选出 critical 级别的，最多 2 个
    const critical = data.errorItems.filter(e => e.status === 'critical');
    if (critical.length >= 2) return critical.slice(0, 2);
    if (critical.length === 1) {
      // 再加一个 warning 的
      const warning = data.errorItems.filter(e => e.status === 'warning');
      if (warning.length > 0) return [critical[0], warning[0]];
      return critical;
    }
    // 没有 critical，取前 2 个 warning
    const warning = data.errorItems.filter(e => e.status === 'warning');
    return warning.slice(0, 2);
  }

  // ========== Toast 提示 ==========
  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 2500;

    // 先移除旧的
    const oldToast = document.getElementById('xingxing-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'xingxing-toast';
    toast.className = 'xx-toast xx-toast-' + type;
    toast.innerHTML = message;

    // 注入样式（如果还没有）
    if (!document.getElementById('xx-toast-style')) {
      const style = document.createElement('style');
      style.id = 'xx-toast-style';
      style.textContent = `
        .xx-toast {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%) translateY(-20px);
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
          z-index: 99999;
          opacity: 0;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(31, 26, 16, 0.15);
          max-width: 90vw;
          text-align: center;
        }
        .xx-toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .xx-toast-info {
          background: linear-gradient(135deg, #fdfbf5, #f7f2e8);
          color: #362e1f;
          border: 1px solid #e0d8cc;
        }
        .xx-toast-gold {
          background: linear-gradient(135deg, #f7ecd0, #e8c97a);
          color: #5c4508;
          border: 1px solid #c9a227;
        }
        .xx-toast-success {
          background: linear-gradient(135deg, #d8f3dc, #b7e4c7);
          color: #2d6a4f;
          border: 1px solid #2d6a4f;
        }
        .xx-toast-warning {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #b07d1e;
          border: 1px solid #b07d1e;
        }
        .xx-toast a {
          color: inherit;
          text-decoration: underline;
          margin-left: 8px;
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .xx-toast {
            top: 60px;
            padding: 10px 18px;
            font-size: 13px;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // 触发显示
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    if (duration > 0) {
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      }, duration);
    }

    return toast;
  }

  function showNewDayToast() {
    const streak = getStreak();
    const lastStreak = getLastStreak();
    let msg = '';

    if (streak > 0) {
      const streakBonus = Math.min(streak * 2, 20);
      if (streakBonus > 0) {
        msg = `新的一天开始啦 🌅 连续复盘 ${streak} 天，连续奖励 +${streakBonus} 积分`;
      } else {
        msg = `新的一天开始啦 🌅 连续复盘 ${streak} 天，今日继续加油`;
      }
    } else if (lastStreak > 0) {
      msg = '新的一天开始啦 🌅 昨天断了，今天捡起来就好';
    } else {
      msg = '新的一天开始啦 🌅 今日宜精进';
    }

    setTimeout(() => showToast(msg, 'gold', 3500), 500);
  }

  // ========== 里程碑徽章 ==========
  function getStreakBadges() {
    const streak = getStreak();
    const badges = [];
    if (streak >= 7) badges.push({ name: '七日不辍', icon: '🔥', level: 7 });
    if (streak >= 30) badges.push({ name: '月度精进', icon: '⭐', level: 30 });
    if (streak >= 100) badges.push({ name: '百日笃行', icon: '🏆', level: 100 });
    return badges;
  }

  function getPointsBadges() {
    const points = getPoints();
    const badges = [];
    if (points >= 100) badges.push({ name: '初入江湖', icon: '🌟', level: 100 });
    if (points >= 500) badges.push({ name: '小有所成', icon: '⭐', level: 500 });
    if (points >= 1000) badges.push({ name: '融会贯通', icon: '🏆', level: 1000 });
    if (points >= 5000) badges.push({ name: '登峰造极', icon: '👑', level: 5000 });
    return badges;
  }

  // ========== 精力管理 ==========
  const ENERGY_KEY = 'xingxing_energy_state';

  function getEnergy() {
    const data = safeGet(ENERGY_KEY, null);
    const today = getTodayStr();
    if (data && data.date === today && typeof data.value === 'number') {
      return data.value;
    }
    // 初始化
    const sleepQuality = getSleepQuality();
    const value = calculateInitialEnergy(sleepQuality);
    setEnergy(value, '初始化');
    return value;
  }

  function setEnergy(value, reason) {
    const today = getTodayStr();
    const clamped = Math.max(0, Math.min(100, value));
    // 直接读存储拿旧值，避免调用 getEnergy 引发递归
    const stored = safeGet(ENERGY_KEY, null);
    const oldValue = (stored && stored.date === today && typeof stored.value === 'number')
      ? stored.value
      : clamped;
    safeSet(ENERGY_KEY, { value: clamped, date: today, lastReason: reason || '' });
    if (oldValue !== clamped) {
      AppEvents.emit(EVENTS.ENERGY_CHANGE, { oldValue, newValue: clamped, reason: reason || '' });
    }
    return clamped;
  }

  function addEnergy(delta, reason) {
    const current = getEnergy();
    return setEnergy(current + delta, reason);
  }

  // ========== 状态管理 ==========
  const STATE_KEY = 'xingxing_mood_state';

  function getState() {
    const data = safeGet(STATE_KEY, null);
    const today = getTodayStr();
    if (data && data.date === today && typeof data.value === 'number') {
      return data.value;
    }
    const sleepQuality = getSleepQuality();
    const value = calculateInitialState(sleepQuality);
    setState(value, '初始化');
    return value;
  }

  function setState(value, reason) {
    const today = getTodayStr();
    const clamped = Math.max(0, Math.min(100, value));
    // 直接读存储拿旧值，避免调用 getState 引发递归
    const stored = safeGet(STATE_KEY, null);
    const oldValue = (stored && stored.date === today && typeof stored.value === 'number')
      ? stored.value
      : clamped;
    safeSet(STATE_KEY, { value: clamped, date: today, lastReason: reason || '' });
    if (oldValue !== clamped) {
      AppEvents.emit(EVENTS.STATE_CHANGE, { oldValue, newValue: clamped, reason: reason || '' });
    }
    return clamped;
  }

  function addState(delta, reason) {
    const current = getState();
    return setState(current + delta, reason);
  }

  // ========== 精神健康值管理 ==========
  const MENTAL_KEY = 'xingxing_mental_health';

  function getMental() {
    const data = safeGet(MENTAL_KEY, null);
    const today = getTodayStr();
    if (data && data.date === today && typeof data.value === 'number') {
      return data.value;
    }
    // 初始值由睡眠质量决定
    const sleepQuality = getSleepQuality();
    const value = calculateInitialMental(sleepQuality);
    safeSet(MENTAL_KEY, { value, date: today });
    return value;
  }

  function calculateMental() {
    const today = getTodayStr();
    const sleepQuality = getSleepQuality();
    const base = calculateInitialMental(sleepQuality);

    // 加上内外耗影响
    const drainData = safeGet('xingxing_drain_events', { events: [], date: today });
    let drainTotal = 0;
    if (drainData.events && drainData.events.length > 0) {
      drainData.events.forEach(ev => {
        drainTotal += (ev.impact || 0);
      });
    }

    // 加上充电恢复的精神值
    const chargeToday = safeGet('xingxing_charge_today', { count: 0, items: [], date: today });
    let chargeMentalRecovery = 0;
    if (chargeToday.items && chargeToday.items.length > 0) {
      chargeToday.items.forEach(item => {
        chargeMentalRecovery += (item.mentalRecover || Math.round((item.stateRecover || 0) * 0.5));
      });
    }

    const result = Math.max(0, Math.min(100, base + drainTotal + chargeMentalRecovery));
    return result;
  }

  function updateMental(reason) {
    const oldValue = getMental();
    const newValue = calculateMental();
    const today = getTodayStr();
    safeSet(MENTAL_KEY, { value: newValue, date: today, lastReason: reason || '' });
    if (oldValue !== newValue) {
      AppEvents.emit(EVENTS.MENTAL_CHANGE, { oldValue, newValue, reason: reason || '' });
    }
    return newValue;
  }

  // ========== 身体素质管理 ==========
  const PHYSICAL_KEY = 'xingxing_physical_health';

  function getPhysical() {
    const data = safeGet(PHYSICAL_KEY, null);
    const today = getTodayStr();
    if (data && data.date === today && typeof data.value === 'number') {
      return data.value;
    }
    const sleepQuality = getSleepQuality();
    const value = calculateInitialPhysical(sleepQuality);
    safeSet(PHYSICAL_KEY, { value, date: today });
    return value;
  }

  function setPhysical(value, reason) {
    const today = getTodayStr();
    const clamped = Math.max(0, Math.min(100, value));
    const oldValue = getPhysical();
    safeSet(PHYSICAL_KEY, { value: clamped, date: today, lastReason: reason || '' });
    if (oldValue !== clamped) {
      AppEvents.emit(EVENTS.PHYSICAL_CHANGE, { oldValue, newValue: clamped, reason: reason || '' });
    }
    return clamped;
  }

  function addPhysical(delta, reason) {
    const current = getPhysical();
    return setPhysical(current + delta, reason);
  }

  // ========== 内外耗事件管理 ==========
  const DRAIN_KEY = 'xingxing_drain_events';

  function getDrainEvents() {
    const today = getTodayStr();
    const data = safeGet(DRAIN_KEY, { events: [], date: today });
    if (data.date !== today) {
      return { events: [], date: today };
    }
    return data;
  }

  function addDrainEvent(eventData) {
    const today = getTodayStr();
    const data = getDrainEvents();
    const newEvent = {
      id: 'd' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: eventData.type || 'external', // external | internal
      name: eventData.name,
      icon: eventData.icon || (eventData.type === 'external' ? '📱' : '😔'),
      impact: -Math.abs(eventData.impact || 5), // 负数表示消耗
      severity: eventData.severity || 'moderate',
      reason: eventData.reason || '',
      duration: eventData.duration || '',
      time: new Date().toTimeString().slice(0, 5),
      date: today
    };
    data.events.push(newEvent);
    data.date = today;
    safeSet(DRAIN_KEY, data);

    // 重新计算精神健康值
    updateMental('添加' + (eventData.type === 'external' ? '外耗' : '内耗') + '事件');
    AppEvents.emit(EVENTS.DRAIN_UPDATED, { type: 'add', event: newEvent });
    return newEvent;
  }

  function removeDrainEvent(eventId) {
    const data = getDrainEvents();
    const idx = data.events.findIndex(e => e.id === eventId);
    if (idx === -1) return null;
    const removed = data.events.splice(idx, 1)[0];
    safeSet(DRAIN_KEY, data);

    // 重新计算精神健康值（删除后回升）
    updateMental('删除消耗事件');
    AppEvents.emit(EVENTS.DRAIN_UPDATED, { type: 'remove', event: removed });
    return removed;
  }

  function getDrainSummary() {
    const data = getDrainEvents();
    let externalDrain = 0;
    let internalDrain = 0;
    data.events.forEach(ev => {
      if (ev.type === 'external') externalDrain += Math.abs(ev.impact);
      else internalDrain += Math.abs(ev.impact);
    });
    return {
      total: externalDrain + internalDrain,
      external: externalDrain,
      internal: internalDrain,
      events: data.events
    };
  }

  // ========== 青蛙任务管理 ==========
  const FROG_KEY = 'xingxing_frog_task';

  function getFrogTask() {
    const today = getTodayStr();
    const data = safeGet(FROG_KEY, null);
    if (data && data.date === today) {
      return data;
    }
    // 默认青蛙任务
    const defaultTask = {
      title: '完成今日最重要的一件事',
      done: false,
      duration: 60, // 分钟
      date: today,
      completedAt: null
    };
    safeSet(FROG_KEY, defaultTask);
    return defaultTask;
  }

  function saveFrogTask(taskData) {
    const today = getTodayStr();
    const current = getFrogTask();
    const newData = { ...current, ...taskData, date: today };
    safeSet(FROG_KEY, newData);
    return newData;
  }

  function completeFrogTask() {
    const task = getFrogTask();
    if (task.done) return task;

    const duration = task.duration || 60;
    // 精力消耗：按预计耗时，每30分钟约-7.5精力
    const energyCost = -Math.round(duration / 30 * 7.5);
    // 状态提升：成就感
    const stateGain = 10;
    // 积分奖励
    const pointsGain = POINTS_CONFIG.FROG_TASK;

    addEnergy(energyCost, '完成青蛙任务');
    addState(stateGain, '完成青蛙任务成就感');
    addPoints(pointsGain, '完成青蛙任务：' + task.title.slice(0, 10));

    const updated = saveFrogTask({
      done: true,
      completedAt: new Date().toTimeString().slice(0, 5)
    });

    AppEvents.emit(EVENTS.FROG_COMPLETED, { task: updated, energyCost, stateGain, pointsGain });
    showToast('青蛙任务完成！精力' + energyCost + '，状态+' + stateGain + '，积分+' + pointsGain, 'gold', 3000);

    return updated;
  }

  function uncompleteFrogTask() {
    const task = getFrogTask();
    if (!task.done) return task;

    const duration = task.duration || 60;
    const energyCost = -Math.round(duration / 30 * 7.5);
    const stateGain = 10;
    const pointsGain = POINTS_CONFIG.FROG_TASK;

    addEnergy(-energyCost, '取消青蛙任务完成');
    addState(-stateGain, '取消青蛙任务');
    addPoints(-pointsGain, '取消青蛙任务');

    const updated = saveFrogTask({
      done: false,
      completedAt: null
    });

    showToast('已取消完成状态', 'info', 2000);
    return updated;
  }

  // ========== 充电记录管理 ==========
  const CHARGE_RECORDS_KEY = 'xingxing_charge_records';
  const CHARGE_TODAY_KEY = 'xingxing_charge_today';

  function getChargeRecords() {
    return safeGet(CHARGE_RECORDS_KEY, []);
  }

  function getTodayChargeRecords() {
    const today = getTodayStr();
    const data = safeGet(CHARGE_TODAY_KEY, { date: today, items: [] });
    if (data.date !== today) return [];
    return data.items || [];
  }

  function addChargeRecord(record) {
    const today = getTodayStr();
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    const newRecord = {
      id: 'cr' + Date.now(),
      methodId: record.methodId,
      methodName: record.methodName,
      icon: record.icon || '🔋',
      category: record.category || '思维',
      date: today,
      time: timeStr,
      duration: record.duration || 15,
      beforeEnergy: record.beforeEnergy,
      beforeState: record.beforeState,
      afterEnergy: record.afterEnergy,
      afterState: record.afterState,
      energyRecover: record.energyRecover || (record.afterEnergy - record.beforeEnergy),
      stateRecover: record.stateRecover || (record.afterState - record.beforeState),
      mentalRecover: record.mentalRecover || Math.round((record.afterState - record.beforeState) * 0.5),
      effectScore: record.effectScore || 3,
      trigger: record.trigger || '',
      mood: record.mood || '',
      note: record.note || ''
    };

    // 保存到总记录
    const allRecords = getChargeRecords();
    allRecords.unshift(newRecord);
    safeSet(CHARGE_RECORDS_KEY, allRecords.slice(0, 500));

    // 保存到今日记录
    const todayData = safeGet(CHARGE_TODAY_KEY, { date: today, items: [] });
    if (todayData.date !== today) {
      todayData.date = today;
      todayData.items = [];
    }
    todayData.items.push(newRecord);
    safeSet(CHARGE_TODAY_KEY, todayData);

    // 更新精力和状态
    setEnergy(newRecord.afterEnergy, '充电：' + record.methodName);
    setState(newRecord.afterState, '充电：' + record.methodName);

    // 更新精神健康值
    updateMental('充电恢复');

    // 加积分（每日上限检测）
    const todayCount = todayData.items.length;
    const dailyMaxPoints = POINTS_CONFIG.CHARGE_MAX_DAILY;
    const currentChargePoints = todayCount * POINTS_CONFIG.CHARGE;
    if (currentChargePoints <= dailyMaxPoints) {
      addPoints(POINTS_CONFIG.CHARGE, '充电打卡：' + record.methodName);
    }

    // 触发事件
    AppEvents.emit(EVENTS.CHARGE_ADDED, { record: newRecord, todayCount: todayData.items.length });

    return newRecord;
  }

  function getTodayChargeSummary() {
    const items = getTodayChargeRecords();
    let energyRecover = 0;
    let stateRecover = 0;
    let mentalRecover = 0;
    items.forEach(item => {
      energyRecover += item.energyRecover || 0;
      stateRecover += item.stateRecover || 0;
      mentalRecover += item.mentalRecover || 0;
    });
    return { count: items.length, energyRecover, stateRecover, mentalRecover, items };
  }

  // ========== 精气神等级判断 ==========
  function getEnergyLevel(value) {
    if (value >= 85) return { text: '充沛', level: 'high' };
    if (value >= 60) return { text: '平稳', level: 'normal' };
    if (value >= 40) return { text: '偏低', level: 'low' };
    return { text: '枯竭', level: 'critical' };
  }

  function getStateLevel(value) {
    if (value >= 85) return { text: '昂扬', level: 'high' };
    if (value >= 60) return { text: '良好', level: 'normal' };
    if (value >= 40) return { text: '低落', level: 'low' };
    return { text: '沮丧', level: 'critical' };
  }

  function getMentalLevel(value) {
    if (value >= 80) return { text: '健康', level: 'high' };
    if (value >= 60) return { text: '平稳', level: 'normal' };
    if (value >= 40) return { text: '波动', level: 'low' };
    return { text: '耗竭', level: 'critical' };
  }

  function getPhysicalLevel(value) {
    if (value >= 85) return { text: '强健', level: 'high' };
    if (value >= 65) return { text: '良好', level: 'normal' };
    if (value >= 45) return { text: '一般', level: 'low' };
    return { text: '虚弱', level: 'critical' };
  }

  // ========== 页面快速过渡 ==========
  function initPageTransition() {
    // 仅保留页面入场的轻微淡入动画，去掉全屏遮罩防止卡住
    var style = document.createElement('style');
    style.textContent = `
      body.page-enter .app-layout > * {
        animation: pt-fadeUp 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both;
      }
      @keyframes pt-fadeUp {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);

    // 页面入场动画标记
    document.body.classList.add('page-enter');
    setTimeout(function() {
      document.body.classList.remove('page-enter');
    }, 400);
  }

  // ========== 暴露到全局 ==========
  global.XingxingCommon = {
    // 工具
    getTodayStr: getTodayStr,
    getYesterdayStr: getYesterdayStr,
    safeGet: safeGet,
    safeSet: safeSet,

    // 事件系统
    Events: AppEvents,
    EVENTS: EVENTS,

    // 积分
    getPoints: getPoints,
    addPoints: addPoints,
    POINTS_CONFIG: POINTS_CONFIG,

    // 连续天数
    getStreak: getStreak,
    getLastStreak: getLastStreak,

    // 分类
    guessCategory: guessCategory,

    // 错题本
    getErrorBookData: getErrorBookData,
    saveErrorBookData: saveErrorBookData,
    findSimilarError: findSimilarError,
    addErrorToBook: addErrorToBook,
    incrementErrorCount: incrementErrorCount,
    isTodayNewError: isTodayNewError,
    getTodayNewErrorCount: getTodayNewErrorCount,
    ensureTodayNewError: ensureTodayNewError,

    // 复盘
    saveReviewData: saveReviewData,
    getReviewData: getReviewData,
    hasReviewOnDate: hasReviewOnDate,

    // 每日重置
    checkDailyReset: checkDailyReset,
    performDailyReset: performDailyReset,
    LAST_ACTIVE_KEY: LAST_ACTIVE_KEY,

    // 今日重点
    getTodayFocusErrors: getTodayFocusErrors,

    // Toast
    showToast: showToast,
    showNewDayToast: showNewDayToast,

    // 徽章
    getStreakBadges: getStreakBadges,
    getPointsBadges: getPointsBadges,

    // 精力
    getEnergy: getEnergy,
    setEnergy: setEnergy,
    addEnergy: addEnergy,

    // 状态
    getState: getState,
    setState: setState,
    addState: addState,

    // 精神健康
    getMental: getMental,
    calculateMental: calculateMental,
    updateMental: updateMental,

    // 身体素质
    getPhysical: getPhysical,
    setPhysical: setPhysical,
    addPhysical: addPhysical,

    // 内外耗
    getDrainEvents: getDrainEvents,
    addDrainEvent: addDrainEvent,
    removeDrainEvent: removeDrainEvent,
    getDrainSummary: getDrainSummary,

    // 青蛙任务
    getFrogTask: getFrogTask,
    saveFrogTask: saveFrogTask,
    completeFrogTask: completeFrogTask,
    uncompleteFrogTask: uncompleteFrogTask,

    // 充电
    getChargeRecords: getChargeRecords,
    getTodayChargeRecords: getTodayChargeRecords,
    addChargeRecord: addChargeRecord,
    getTodayChargeSummary: getTodayChargeSummary,

    // 等级判断
    getEnergyLevel: getEnergyLevel,
    getStateLevel: getStateLevel,
    getMentalLevel: getMentalLevel,
    getPhysicalLevel: getPhysicalLevel,

    // 页面过渡
    initPageTransition: initPageTransition,
  };

  // 便捷别名 App（更短的命名空间）
  global.App = global.XingxingCommon;

  // 自动初始化：页面过渡层（越早越好，让体感更快）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageTransition);
  } else {
    initPageTransition();
  }

})(window);
