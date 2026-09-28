/* ============================================
   行醒后端 - 演示数据种子
   给新用户预置一套「看起来在用」的数据（复盘 / 目标 / 错题 / 积分），
   方便演示与录屏。
   ============================================ */

function pad(n) { return String(n).padStart(2, '0'); }
function dayStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

function seedUser(db, userId) {
  const now = new Date();
  const ago = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

  // 时间戳略微提前到「未来 60 秒」，确保首次同步拉取时云端数据优先于浏览器里的旧本地数据
  const stamp = new Date(Date.now() + 60000).toISOString();
  const set = (key, value) => {
    db.prepare(`
      INSERT INTO user_data (user_id, data_key, data_value, updated_at, is_deleted)
      VALUES (?, ?, ?, ?, 0)
      ON CONFLICT(user_id, data_key) DO UPDATE SET
        data_value = excluded.data_value,
        updated_at = excluded.updated_at,
        is_deleted = 0
    `).run(userId, key, JSON.stringify(value), stamp);
  };

  // 积分 / 连续天数 / 统计
  set('xingxing_points', 302);
  set('xingxing_streak', 12);
  set('xingxing_total_reviews', 12);
  set('xingxing_total_errors', 6);

  // 复盘（最近三天）
  const reviews = [
    { d: 1, mood: '😊', s1: '完成了雅思阅读三篇练习，正确率有所提升', s2: '学到了一个新的解题方法：关键词定位法', s3: '明天要练习听力 Section 3' },
    { d: 2, mood: '😐', s1: '复习了错题本', s2: '整理了学习笔记', s3: '继续保持' },
    { d: 3, mood: '😊', s1: '开始使用错题本', s2: '认识到自己的拖延问题', s3: '制定了改进计划' }
  ];
  reviews.forEach(r => {
    const d = ago(r.d);
    set('xingxing_review_' + dayStr(d), {
      sanxing: { 1: r.s1, 2: r.s2, 3: r.s3 },
      mood: r.mood,
      completed: true,
      timestamp: d.getTime()
    });
  });

  // 目标（OKR）
  set('xingxing_okrs', {
    okrs: [
      { id: 'okr_seed_1', title: '雅思总分 7.0', category: '英语·核心', status: 'active', dueDate: '冬至为期',
        keyResults: [
          { title: 'Reading 7.5 分', progress: 65 },
          { title: 'Listening 7.0 分', progress: 60 },
          { title: 'Writing 6.5 分', progress: 55 },
          { title: 'Speaking 6.5 分', progress: 60 }
        ] },
      { id: 'okr_seed_2', title: '逻辑学筑基与结构化表达', category: '思维·核心', status: 'active', dueDate: '冬至为期',
        keyResults: [
          { title: '读完陈波《逻辑学导论》', progress: 50 },
          { title: '每日结构化表达练习', progress: 45 },
          { title: '30 次即兴演讲', progress: 40 }
        ] },
      { id: 'okr_seed_3', title: '心理学认知体系搭建', category: '心理·拓展', status: 'active', dueDate: '冬至为期',
        keyResults: [
          { title: '李玫瑾犯罪心理学', progress: 40 },
          { title: '武志红心理学课', progress: 35 },
          { title: '行为经济学入门', progress: 30 }
        ] },
      { id: 'okr_seed_4', title: '知识库错题本', category: '工具·基础', status: 'risk', dueDate: '冬至为期',
        keyResults: [
          { title: '记录 100 个错题', progress: 25 },
          { title: '事不过三标记机制', progress: 20 },
          { title: '每月复习', progress: 15 }
        ] },
      { id: 'okr_seed_5', title: '身体素质提升', category: '身体·基础', status: 'active', dueDate: '冬至为期',
        keyResults: [
          { title: '每周跑步 3 次', progress: 60 },
          { title: '每日拉伸', progress: 55 },
          { title: '睡眠 7 小时', progress: 50 }
        ] }
    ]
  });

  // 错题本
  set('xingxing_error_book', {
    categories: [
      { id: 'c5', name: '学习方法', icon: '📚', color: '#2980b9' },
      { id: 'c2', name: '行为习惯', icon: '⏰', color: '#e67e22' }
    ],
    errorItems: [
      { id: 'err_seed_1', categoryId: 'c5', title: '雅思听力 Section 3 跟不上', description: '做听力时 Section 3 的选择题总是跟不上节奏，漏听关键信息',
        errorCount: 3, masteryLevel: 55, status: 'warning', lastErrorDate: dayStr(ago(1)), firstErrorDate: dayStr(ago(5)),
        tags: ['雅思', '听力', '技巧'],
        errorReasons: ['读题速度慢', '没有预判答案类型'], solutions: ['提前读题划关键词', '练习跟读'],
        history: [{ date: dayStr(ago(1)), context: '剑 17 Test 2 听力 Section 3 错了 5 道', reflection: '' }],
        consecutiveSuccess: 0, practicedSolutions: [], addedFromReview: true, addedDate: dayStr(ago(5)) },
      { id: 'err_seed_2', categoryId: 'c2', title: '做事拖延，临急抱佛脚', description: '总是拖到最后一刻才开始，质量不稳定',
        errorCount: 5, masteryLevel: 45, status: 'critical', lastErrorDate: dayStr(ago(2)), firstErrorDate: dayStr(ago(8)),
        tags: ['拖延', '习惯'],
        errorReasons: ['完美主义', '畏难'], solutions: ['先做五分钟', '把任务拆小'],
        history: [{ date: dayStr(ago(2)), context: '论文拖到最后一天', reflection: '' }],
        consecutiveSuccess: 0, practicedSolutions: [], addedFromReview: true, addedDate: dayStr(ago(8)) }
    ]
  });
}

module.exports = { seedUser };
