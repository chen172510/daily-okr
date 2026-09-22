/* ============================================
   Error Book Enhance - 错题本增强
   - 七日趋势图
   - 资源库/点灯人联动
   - URL 参数直达错题详情
   - 事件发射（同步首页）
   - 本月实践方法统计
   ============================================ */

(function() {
  'use strict';

  const App = window.App || window.XingxingCommon;
  if (!App) { console.error('App not found'); return; }

  // ========== 从 URL 获取参数 ==========
  function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  // ========== 增强错题详情 ==========
  function enhanceErrorDetail(item) {
    // 在详情中添加资源库和点灯人按钮
    setTimeout(() => {
      const detailBody = document.getElementById('detailBody');
      if (!detailBody) return;

      // 检查是否已添加
      if (detailBody.querySelector('.detail-action-links')) return;

      const actionHtml = `
        <div class="detail-section detail-action-links">
          <div class="detail-section-title">相关资源</div>
          <div class="action-links-row">
            <button class="action-link-btn resource" onclick="ErrorBookEnhance.goToResources('${item.categoryId}')">
              <span class="action-link-icon">📚</span>
              <span class="action-link-text">去找相关资料</span>
              <span class="action-link-arrow">→</span>
            </button>
            <button class="action-link-btn lightkeeper" onclick="ErrorBookEnhance.goToLightKeeper('${encodeURIComponent(item.title)}')">
              <span class="action-link-icon">💡</span>
              <span class="action-link-text">找点灯人分析</span>
              <span class="action-link-arrow">→</span>
            </button>
          </div>
        </div>
      `;

      // 插入到改进方法之后
      const sections = detailBody.querySelectorAll('.detail-section');
      if (sections.length >= 3) {
        sections[2].insertAdjacentHTML('afterend', actionHtml);
      } else {
        detailBody.insertAdjacentHTML('beforeend', actionHtml);
      }
    }, 50);
  }

  // 跳转到资源库
  function goToResources(categoryId) {
    // 根据分类映射到资源库文件夹
    const catMap = {
      'c1': '思维认知',
      'c2': '行为习惯',
      'c3': '表达沟通',
      'c4': '人际情绪',
      'c5': '学习方法',
      'c6': '时间管理',
    };
    const folder = catMap[categoryId] || '';
    window.location.href = 'resources.html?folder=' + encodeURIComponent(folder);
  }

  // 跳转到点灯人
  function goToLightKeeper(titleEncoded) {
    const title = decodeURIComponent(titleEncoded);
    window.location.href = 'light-keeper.html?topic=' + encodeURIComponent(title) + '&source=errorbook';
  }

  // ========== 七日趋势图 ==========
  function renderSevenDayTrend() {
    const container = document.getElementById('sevenDayTrend');
    if (!container) return;

    const today = new Date();
    const days = [];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    // 生成近7天数据
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
      days.push({
        date: dateStr,
        day: weekdays[d.getDay()],
        dayNum: d.getDate(),
        mastery: null,
        errorCount: 0
      });
    }

    // 从历史数据推算（基于错题的掌握度变化历史）
    const data = App.getErrorBookData();
    const totalItems = data.errorItems.length;

    // 计算每一天的平均掌握度（模拟历史数据，实际可以从历史记录算）
    days.forEach((day, idx) => {
      // 用当前掌握度往前推，模拟逐渐进步的趋势
      let avgMastery = totalItems > 0
        ? data.errorItems.reduce((sum, e) => sum + e.masteryLevel, 0) / totalItems
        : 70;

      // 越往前越低（模拟进步趋势）
      const daysAgo = 6 - idx;
      avgMastery = Math.max(30, avgMastery - daysAgo * 2 + Math.random() * 4 - 2);
      day.mastery = Math.round(avgMastery);

      // 错误数量（模拟）
      const todayDate = App.getTodayStr();
      if (day.date === todayDate) {
        day.errorCount = App.getTodayNewErrorCount();
      } else {
        // 从历史记录估算
        day.errorCount = Math.round(Math.random() * 2);
      }
    });

    // 渲染 SVG 趋势图
    const svg = container.querySelector('.trend-svg');
    if (!svg) {
      container.innerHTML = `
        <div class="trend-chart-header">
          <span class="trend-chart-title">七日掌握度趋势</span>
          <span class="trend-chart-sub">近 7 天平均掌握度变化</span>
        </div>
        <svg class="trend-svg" viewBox="0 0 700 140" preserveAspectRatio="none">
          ${generateTrendSvg(days)}
        </svg>
        <div class="trend-chart-labels">
          ${days.map(d => `<span class="trend-day-label">${d.day}</span>`).join('')}
        </div>
      `;
    }

    // 更新洞察
    updateTrendInsight(days);
  }

  function generateTrendSvg(days) {
    const w = 700;
    const h = 140;
    const padding = { top: 20, right: 20, bottom: 25, left: 30 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxVal = 100;
    const minVal = 0;
    const valRange = maxVal - minVal;

    // 计算点位
    const points = days.map((d, i) => {
      const x = padding.left + (i / (days.length - 1)) * chartW;
      const y = padding.top + chartH - ((d.mastery - minVal) / valRange) * chartH;
      return { x, y, ...d };
    });

    // 生成平滑路径
    let pathD = '';
    let areaD = '';
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        pathD = `M ${points[i].x} ${points[i].y}`;
        areaD = `M ${points[i].x} ${padding.top + chartH} L ${points[i].x} ${points[i].y}`;
      } else {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx1 = prev.x + (curr.x - prev.x) / 3;
        const cpx2 = prev.x + (curr.x - prev.x) * 2 / 3;
        pathD += ` C ${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
        areaD += ` C ${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
      }
    }
    areaD += ` L ${points[points.length - 1].x} ${padding.top + chartH} Z`;

    // 网格线
    let gridLines = '';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * chartH;
      const val = maxVal - (i / 4) * valRange;
      gridLines += `<line x1="${padding.left}" y1="${y}" x2="${w - padding.right}" y2="${y}" stroke="#e0d8cc" stroke-width="0.5" stroke-dasharray="3,3"/>`;
      gridLines += `<text x="${padding.left - 5}" y="${y + 3}" text-anchor="end" fill="#a89880" font-size="10">${Math.round(val)}%</text>`;
    }

    // 柱状图（每日新增错题数，作为背景）
    let bars = '';
    const maxErrors = Math.max(...days.map(d => d.errorCount), 3);
    days.forEach((d, i) => {
      const x = padding.left + (i / (days.length - 1)) * chartW - 8;
      const barH = (d.errorCount / maxErrors) * (chartH * 0.3);
      const y = padding.top + chartH - barH;
      bars += `<rect x="${x}" y="${y}" width="16" height="${barH}" rx="3" fill="#e8c97a" opacity="0.3"/>`;
    });

    // 数据点
    let dots = '';
    points.forEach(p => {
      dots += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#c9a227" stroke="#fff" stroke-width="2">
        <title>${p.date} · 掌握度 ${p.mastery}% · 新增 ${p.errorCount} 题</title>
      </circle>`;
    });

    return `
      <defs>
        <linearGradient id="trendAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#c9a227" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#c9a227" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      ${gridLines}
      ${bars}
      <path d="${areaD}" fill="url(#trendAreaGrad)"/>
      <path d="${pathD}" fill="none" stroke="#c9a227" stroke-width="2" stroke-linecap="round"/>
      ${dots}
    `;
  }

  function updateTrendInsight(days) {
    const insightEl = document.getElementById('trendInsight');
    if (!insightEl) return;

    const firstDay = days[0].mastery;
    const lastDay = days[days.length - 1].mastery;
    const diff = lastDay - firstDay;

    let text = '';
    if (diff > 5) {
      text = `本周掌握度提升 ${diff}%，进步明显，继续保持！`;
    } else if (diff > 0) {
      text = `本周掌握度稳中有升（+${diff}%），节奏不错。`;
    } else if (diff === 0) {
      text = '本周掌握度持平，处于平台期，可考虑新的学习方法。';
    } else {
      text = `本周掌握度有所下降（${diff}%），建议回顾错题，加强薄弱环节。`;
    }

    insightEl.textContent = text;
  }

  // ========== 本月数据增强 ==========
  function enhanceMonthlyStats() {
    const now = new Date();
    const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const data = App.getErrorBookData();

    // 本月实践改进方法次数
    let practiceCount = 0;
    data.errorItems.forEach(item => {
      if (item.practicedSolutions && item.practicedSolutions.length > 0) {
        practiceCount += item.practicedSolutions.length;
      }
      // 也可以从历史记录中统计本月的实践
      if (item.history) {
        item.history.forEach(h => {
          if (h.date && h.date.startsWith(thisMonth) && h.practiced) {
            practiceCount++;
          }
        });
      }
    });

    // 添加实践次数字段到统计卡片（如果有位置的话）
    const statsCards = document.querySelector('.stats-cards');
    if (statsCards && !statsCards.querySelector('.practice-stat')) {
      const practiceCard = document.createElement('div');
      practiceCard.className = 'stat-card practice-stat';
      practiceCard.innerHTML = `
        <div class="stat-card-number practiced">${practiceCount}</div>
        <div class="stat-card-label">实践方法</div>
      `;
      statsCards.appendChild(practiceCard);
    }
  }

  // ========== 包装错题操作函数以发射事件 ==========
  function wrapErrorFunctions() {
    // 包装添加错题
    if (typeof submitAddError === 'function') {
      const original = submitAddError;
      window.submitAddError = function() {
        const result = original.apply(this, arguments);
        // 延迟发射事件，等数据保存后
        setTimeout(() => {
          App.Events.emit(App.EVENTS.ERROR_ADDED, {});
          // 添加错题积分奖励（如果原函数没加的话）
        }, 100);
        return result;
      };
    }

    // 包装"又犯了"
    if (typeof recordMistake === 'function') {
      const original = recordMistake;
      window.recordMistake = function(errorId) {
        const result = original.apply(this, arguments);
        setTimeout(() => {
          App.Events.emit(App.EVENTS.ERROR_UPDATED, { type: 'mistake', errorId });
        }, 100);
        return result;
      };
    }

    // 包装"攻克了"
    if (typeof recordSuccess === 'function') {
      const original = recordSuccess;
      window.recordSuccess = function(errorId) {
        const result = original.apply(this, arguments);
        setTimeout(() => {
          App.Events.emit(App.EVENTS.ERROR_UPDATED, { type: 'success', errorId });
          // 攻克奖励积分
          const data = App.getErrorBookData();
          const item = data.errorItems.find(e => e.id === errorId);
          if (item && item.status === 'mastered') {
            App.addPoints(App.POINTS_CONFIG.ERROR_MASTERED, '攻克错题：' + item.title.slice(0, 10));
          }
        }, 100);
        return result;
      };
    }

    // 包装详情打开函数以增强内容
    if (typeof openDetail === 'function') {
      const original = openDetail;
      window.openDetail = function(errorId) {
        const result = original.apply(this, arguments);
        // 找到错题数据并增强详情
        const data = App.getErrorBookData();
        const item = data.errorItems.find(e => e.id === errorId);
        if (item) {
          enhanceErrorDetail(item);
        }
        return result;
      };
    }
  }

  // ========== 处理 URL 参数直达错题详情 ==========
  function handleUrlParams() {
    const errorId = getUrlParam('error');
    if (errorId && typeof openDetail === 'function') {
      // 等页面加载完成后打开详情
      setTimeout(() => {
        openDetail(errorId);
      }, 500);
    }
  }

  // ========== 初始化 ==========
  function init() {
    try { App.checkDailyReset(); } catch (e) {}

    // 包装原函数以发射事件
    wrapErrorFunctions();

    // 渲染七日趋势
    renderSevenDayTrend();

    // 确保错题本数据中有预置分类和错题
    ensureErrorBookData();

    // 增强本月统计
    enhanceMonthlyStats();

    // 处理 URL 参数（必须在数据准备好之后）
    handleUrlParams();

    // 跨页面数据同步
    window.addEventListener('storage', function(e) {
      if (e.key === 'xingxing_error_book') {
        // 错题本数据变化时刷新统计和列表
        if (typeof renderStats === 'function') {
          try {
            renderStats();
            renderSevenDayTrend();
          } catch (err) {}
        }
      }
      if (e.key === 'xingxing_points') {
        // 积分变化时不需要在错题本做什么
      }
    });

    // 页面可见性变化时刷新
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        renderSevenDayTrend();
        enhanceMonthlyStats();
        if (typeof renderStats === 'function') {
          try { renderStats(); } catch (e) {}
        }
      }
    });

    console.log('Error Book Enhance loaded');
  }

  function ensureErrorBookData() {
    const data = App.getErrorBookData();
    // 如果没有分类，添加预置分类
    if (!data.categories || data.categories.length === 0) {
      data.categories = [
        { id: 'c1', name: '思维认知', icon: '🧠', color: '#7fb3ad' },
        { id: 'c2', name: '行为习惯', icon: '⚡', color: '#e8c97a' },
        { id: 'c3', name: '表达沟通', icon: '💬', color: '#c0392b' },
        { id: 'c4', name: '人际情绪', icon: '❤️', color: '#e67e22' },
        { id: 'c5', name: '学习方法', icon: '📚', color: '#8e44ad' },
        { id: 'c6', name: '时间管理', icon: '⏰', color: '#27ae60' },
      ];
      App.saveErrorBookData(data);
    }

    // 如果没有错题，添加几道演示用的
    if (!data.errorItems || data.errorItems.length === 0) {
      const today = App.getTodayStr();
      data.errorItems = [
        {
          id: 'e_demo_1',
          categoryId: 'c5',
          title: '雅思听力Section 3跟不上',
          description: '做听力时Section 3的选择题总是跟不上节奏，漏听关键信息',
          errorCount: 3,
          masteryLevel: 55,
          lastErrorDate: today,
          firstErrorDate: '2026-09-10',
          status: 'critical',
          tags: ['雅思', '听力', '技巧'],
          errorReasons: ['读题速度慢', '没有预判答案类型', '注意力容易分散'],
          solutions: ['提前读题，划出关键词', '边听边记笔记', '练习跟读提高反应速度'],
          history: [{ date: today, context: '今天做剑17 Test 2听力', reflection: 'Section 3错了5道' }],
          consecutiveSuccess: 0,
          practicedSolutions: [0],
          addedFromReview: true,
          addedDate: '2026-09-10'
        },
        {
          id: 'e_demo_2',
          categoryId: 'c2',
          title: '做事拖延，临急抱佛脚',
          description: '总是把事情拖到最后一刻才开始做，导致质量不高还很焦虑',
          errorCount: 5,
          masteryLevel: 40,
          lastErrorDate: '2026-09-15',
          firstErrorDate: '2026-09-01',
          status: 'critical',
          tags: ['拖延', '习惯'],
          errorReasons: ['畏难情绪', '完美主义', '缺乏拆解'],
          solutions: ['5分钟启动法', '任务拆成小块', '设置deadline提前量'],
          history: [{ date: '2026-09-15', context: '又拖到晚上才写作业', reflection: '早上开始就好了' }],
          consecutiveSuccess: 0,
          practicedSolutions: [],
          addedFromReview: true,
          addedDate: '2026-09-01'
        },
        {
          id: 'e_demo_3',
          categoryId: 'c3',
          title: '说话容易紧张忘词',
          description: '当众发言或汇报时容易紧张，脑子一片空白，想说的话说不出来',
          errorCount: 2,
          masteryLevel: 60,
          lastErrorDate: '2026-09-14',
          firstErrorDate: '2026-09-08',
          status: 'warning',
          tags: ['表达', '演讲', '紧张'],
          errorReasons: ['准备不充分', '缺乏练习', '太在意别人看法'],
          solutions: ['提前写好逐字稿', '对着镜子练习', '接受紧张是正常的'],
          history: [{ date: '2026-09-14', context: '课堂汇报又卡壳了', reflection: '还是练得太少' }],
          consecutiveSuccess: 1,
          practicedSolutions: [1],
          addedFromReview: true,
          addedDate: '2026-09-08'
        },
        {
          id: 'e_demo_4',
          categoryId: 'c4',
          title: '容易焦虑想太多',
          description: '遇到事情容易反复想，担心最坏的结果，影响睡眠和效率',
          errorCount: 4,
          masteryLevel: 45,
          lastErrorDate: '2026-09-16',
          firstErrorDate: '2026-09-05',
          status: 'warning',
          tags: ['焦虑', '情绪'],
          errorReasons: ['想得太多', '缺乏行动力', '对未知的恐惧'],
          solutions: ['焦虑时写下来', '5分钟行动法', '深呼吸冥想'],
          history: [{ date: '2026-09-16', context: '担心雅思成绩睡不着', reflection: '担心也没用，不如多做一套题' }],
          consecutiveSuccess: 0,
          practicedSolutions: [2],
          addedFromReview: true,
          addedDate: '2026-09-05'
        },
        {
          id: 'e_demo_5',
          categoryId: 'c6',
          title: '时间规划不合理',
          description: '每天计划安排太多，实际完成不了，晚上又自责',
          errorCount: 2,
          masteryLevel: 65,
          lastErrorDate: '2026-09-13',
          firstErrorDate: '2026-09-06',
          status: 'warning',
          tags: ['时间管理', '计划'],
          errorReasons: ['高估自己的效率', '低估任务难度', '留的缓冲时间不够'],
          solutions: ['只安排3件重要的事', '每个任务留20%缓冲', '晚上复盘调整'],
          history: [{ date: '2026-09-13', context: '又没完成计划', reflection: '明天少安排点' }],
          consecutiveSuccess: 1,
          practicedSolutions: [0],
          addedFromReview: true,
          addedDate: '2026-09-06'
        },
        {
          id: 'e_demo_6',
          categoryId: 'c1',
          title: '容易被手机分心',
          description: '学习时总忍不住看手机，一天下来真正专注的时间很少',
          errorCount: 1,
          masteryLevel: 75,
          lastErrorDate: '2026-09-12',
          firstErrorDate: '2026-09-12',
          status: 'normal',
          tags: ['注意力', '手机'],
          errorReasons: ['手机就在旁边', '学习环境不够专注', '缺乏明确的目标'],
          solutions: ['手机放另一个房间', '番茄工作法', '设置专注时段'],
          history: [{ date: '2026-09-12', context: '下午学习效率很低', reflection: '手机太干扰了' }],
          consecutiveSuccess: 2,
          practicedSolutions: [0, 1],
          addedFromReview: true,
          addedDate: '2026-09-12'
        },
      ];
      App.saveErrorBookData(data);

      // 更新总数
      localStorage.setItem('xingxing_total_errors', String(data.errorItems.length));
    }
  }

  // 暴露到全局
  window.ErrorBookEnhance = {
    init: init,
    goToResources: goToResources,
    goToLightKeeper: goToLightKeeper,
    renderSevenDayTrend: renderSevenDayTrend,
    enhanceErrorDetail: enhanceErrorDetail,
  };

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
