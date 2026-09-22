/* ============================================
   省身脉络图 · 动态数据生成
   从今日内耗、外耗、充电、青蛙任务、复盘数据
   动态生成节点与连线
   ============================================ */

(function() {
  'use strict';

  var App = window.XingxingCommon || window.App;

  // 根据文本关键词推断情绪类型
  function inferEmotion(text) {
    if (!text) return { id: 'emo_neutral', label: '心绪', desc: '今日心境平和', icon: '😐' };
    var t = text.toLowerCase();
    if (/焦虑|担心|紧张|不安|怕|慌|忧/.test(t)) {
      return { id: 'emo_anxiety', label: '焦虑', desc: '心有不安，思虑过多', icon: '😰' };
    }
    if (/疲惫|累|困|乏|昏|没精神/.test(t)) {
      return { id: 'emo_tired', label: '疲惫', desc: '精神不济，昏昏欲睡', icon: '😴' };
    }
    if (/纠结|犹豫|想太多|决策|反复/.test(t)) {
      return { id: 'emo_overthink', label: '纠结', desc: '思虑反复，难以决断', icon: '🤔' };
    }
    if (/怀疑|自责|内疚|后悔|不够/.test(t)) {
      return { id: 'emo_doubt', label: '自我怀疑', desc: '对自己不够确信', icon: '😔' };
    }
    if (/拖延|懒|不想|提不起/.test(t)) {
      return { id: 'emo_procrastinate', label: '拖延', desc: '遇事不决，往后推延', icon: '⏰' };
    }
    if (/满足|开心|高兴|充实|收获|爽|棒/.test(t)) {
      return { id: 'emo_happy', label: '满足', desc: '今日收获颇丰，心中安然', icon: '😊' };
    }
    if (/专注|心流|投入|沉浸|效率/.test(t)) {
      return { id: 'emo_focus', label: '专注', desc: '心神凝聚，效率颇高', icon: '🎯' };
    }
    return { id: 'emo_neutral', label: '心绪', desc: '今日心境平和', icon: '😐' };
  }

  // 根据内耗事件生成问题节点
  function inferProblem(text, impact) {
    if (!text) return null;
    var t = text;
    if (/焦虑|担心|紧张|不安/.test(t)) {
      return { id: 'prob_anxiety', label: '情绪内耗', desc: '过度思虑，消耗心神', severity: impact };
    }
    if (/纠结|犹豫|想太多|反复/.test(t)) {
      return { id: 'prob_overthink', label: '过度思考', desc: '决策疲劳，想多做少', severity: impact };
    }
    if (/怀疑|自责|不够|不行/.test(t)) {
      return { id: 'prob_doubt', label: '自我怀疑', desc: '信心不足，自我否定', severity: impact };
    }
    if (/拖延|懒|不想|推/.test(t)) {
      return { id: 'prob_procrastinate', label: '拖延症', desc: '遇事往后推，行动力不足', severity: impact };
    }
    if (/完美|完美主义|细节/.test(t)) {
      return { id: 'prob_perfect', label: '完美主义', desc: '追求极致，反而停滞', severity: impact };
    }
    return { id: 'prob_inner_' + (Math.random().toString(36).slice(2, 6)),
             label: t.length > 6 ? t.slice(0, 6) + '…' : t,
             desc: text, severity: impact };
  }

  // 从文本中提取知识/收获节点
  function extractKnowledge(text) {
    if (!text) return [];
    var lines = text.split(/[。！？\n；;]/).filter(function(s) { return s.trim().length > 2; });
    return lines.slice(0, 3).map(function(line, i) {
      var trimmed = line.trim();
      return {
        id: 'know_' + i,
        label: trimmed.length > 8 ? trimmed.slice(0, 8) + '…' : trimmed,
        desc: trimmed
      };
    });
  }

  // 从文本中提取问题/改进节点
  function extractProblems(text) {
    if (!text) return [];
    var lines = text.split(/[。！？\n；;]/).filter(function(s) { return s.trim().length > 2; });
    return lines.slice(0, 3).map(function(line, i) {
      var trimmed = line.trim();
      return {
        id: 'prob_' + i,
        label: trimmed.length > 8 ? trimmed.slice(0, 8) + '…' : trimmed,
        desc: trimmed
      };
    });
  }

  // 主函数：生成动态图谱数据
  function generateDynamicGraphData() {
    if (!App) return getFallbackData();

    var nodes = [];
    var edges = [];
    var nodeIds = {}; // 去重用

    function addNode(node) {
      if (nodeIds[node.id]) return false;
      nodeIds[node.id] = true;
      nodes.push(node);
      return true;
    }

    function addEdge(edge) {
      edges.push(edge);
    }

    // ========== 1. 青蛙任务（目标节点）==========
    try {
      var frog = App.getFrogTask();
      if (frog && frog.title) {
        var frogLabel = frog.title.length > 8 ? frog.title.slice(0, 8) + '…' : frog.title;
        addNode({
          id: 'goal_frog',
          type: 'goal',
          label: frogLabel,
          desc: frog.title + '（今日青蛙任务，预计' + frog.duration + '分钟）',
          r: frog.done ? 24 : 22
        });

        if (frog.done) {
          // 完成 → 满足情绪
          addNode({ id: 'emo_satisfaction', type: 'emotion', label: '满足', desc: '完成今日最重要之事，心生满足', r: 18, icon: '😊' });
          addEdge({ source: 'goal_frog', target: 'emo_satisfaction', type: 'cause', label: '完成带来满足' });
        } else {
          // 未完成 → 关联问题
          addNode({ id: 'prob_frog_todo', type: 'problem', label: '待攻克', desc: '今日青蛙任务尚未完成', r: 18 });
          addEdge({ source: 'goal_frog', target: 'prob_frog_todo', type: 'link', label: '尚未完成' });
        }
      }
    } catch (e) {}

    // ========== 2. 内耗事件 ==========
    try {
      var drainData = App.getDrainEvents();
      var internalEvents = drainData.events.filter(function(e) { return e.type === 'internal'; });

      internalEvents.forEach(function(ev, idx) {
        var eventId = 'drain_int_' + ev.id;
        var impactVal = Math.abs(ev.impact);
        var label = ev.name.length > 8 ? ev.name.slice(0, 8) + '…' : ev.name;
        var nodeR = 16 + Math.min(impactVal, 15) * 0.6;

        addNode({
          id: eventId,
          type: 'event',
          label: label,
          desc: ev.name + (ev.reason ? ' — ' + ev.reason : '') + '（内耗，影响' + impactVal + '）',
          r: nodeR,
          icon: ev.icon
        });

        // 推断情绪节点
        var emotion = inferEmotion(ev.name + ' ' + (ev.reason || ''));
        addNode({
          id: emotion.id,
          type: 'emotion',
          label: emotion.label,
          desc: emotion.desc,
          r: 18,
          icon: emotion.icon
        });
        addEdge({ source: eventId, target: emotion.id, type: 'cause', label: ev.name + '致' + emotion.label });

        // 推断问题节点
        var problem = inferProblem(ev.name + ' ' + (ev.reason || ''), impactVal);
        if (problem) {
          addNode({
            id: problem.id,
            type: 'problem',
            label: problem.label,
            desc: problem.desc,
            r: 16 + Math.min(problem.severity, 15) * 0.4
          });
          addEdge({ source: emotion.id, target: problem.id, type: 'link', label: '内耗之因' });

          // 推导：问题 → 改进方向（连接到知识或目标）
          if (problem.id === 'prob_anxiety') {
            addEdge({ source: problem.id, target: 'know_calm', type: 'derive', label: '以静心解焦虑' });
          } else if (problem.id === 'prob_overthink') {
            addEdge({ source: problem.id, target: 'know_action', type: 'derive', label: '以行动破纠结' });
          } else if (problem.id === 'prob_doubt') {
            addEdge({ source: problem.id, target: 'goal_frog', type: 'derive', label: '以成果树信心' });
          } else if (problem.id === 'prob_procrastinate') {
            addEdge({ source: problem.id, target: 'goal_frog', type: 'derive', label: '先做五分钟' });
          }
        }
      });
    } catch (e) {}

    // ========== 3. 外耗事件 ==========
    try {
      var externalEvents = drainData.events.filter(function(e) { return e.type === 'external'; });

      externalEvents.forEach(function(ev) {
        var eventId = 'drain_ext_' + ev.id;
        var impactVal = Math.abs(ev.impact);
        var label = ev.name.length > 8 ? ev.name.slice(0, 8) + '…' : ev.name;
        var nodeR = 16 + Math.min(impactVal, 15) * 0.6;

        addNode({
          id: eventId,
          type: 'event',
          label: label,
          desc: ev.name + (ev.reason ? ' — ' + ev.reason : '') + '（外耗，影响' + impactVal + '）',
          r: nodeR,
          icon: ev.icon
        });

        // 外耗 → 疲惫情绪
        addNode({
          id: 'emo_fatigue',
          type: 'emotion',
          label: '疲惫',
          desc: '外界干扰消耗心神',
          r: 18,
          icon: '😮‍💨'
        });
        addEdge({ source: eventId, target: 'emo_fatigue', type: 'cause', label: ev.name + '耗神' });

        // 外耗 → 分心问题
        addNode({
          id: 'prob_distraction',
          type: 'problem',
          label: '注意力分散',
          desc: '外界干扰导致注意力难以集中',
          r: 18
        });
        addEdge({ source: eventId, target: 'prob_distraction', type: 'link', label: '打断专注' });
      });
    } catch (e) {}

    // ========== 4. 充电记录 ==========
    try {
      var chargeRecords = App.getTodayChargeRecords();
      if (chargeRecords && chargeRecords.length > 0) {
        chargeRecords.forEach(function(rec, idx) {
          var chargeId = 'charge_' + idx;
          var recName = rec.methodName || rec.name || '充电';
          var label = recName.length > 8 ? recName.slice(0, 8) + '…' : recName;
          addNode({
            id: chargeId,
            type: 'event',
            label: label,
            desc: recName + '，恢复精力' + (rec.energyRecover || 0) + '%',
            r: 18,
            icon: rec.icon || '🔋'
          });

          // 充电 → 精力恢复/满足
          addNode({
            id: 'emo_recover',
            type: 'emotion',
            label: '恢复',
            desc: '充电后身心得到恢复',
            r: 18,
            icon: '💚'
          });
          addEdge({ source: chargeId, target: 'emo_recover', type: 'cause', label: '充电带来恢复' });

          // 充电 → 反哺目标
          if (nodeIds['goal_frog']) {
            addEdge({ source: chargeId, target: 'goal_frog', type: 'derive', label: '充电以攻坚' });
          }
        });
      }
    } catch (e) {}

    // ========== 5. 复盘三省内容 ==========
    try {
      var today = App.getTodayStr();
      var reviewData = App.getReviewData(today);

      if (reviewData && reviewData.sanxing) {
        // 今日何得 → 知识节点
        var gains = extractKnowledge(reviewData.sanxing[2] || reviewData.sanxing['2'] || '');
        gains.forEach(function(g) {
          var kid = 'know_gain_' + g.id;
          addNode({
            id: kid,
            type: 'knowledge',
            label: g.label,
            desc: g.desc,
            r: 20
          });
          // 知识 → 目标（推导）
          if (nodeIds['goal_frog']) {
            addEdge({ source: kid, target: 'goal_frog', type: 'derive', label: '新知助力目标' });
          }
        });

        // 今日何为 → 事件节点补充
        var deeds = reviewData.sanxing[1] || reviewData.sanxing['1'] || '';
        if (deeds && deeds.trim()) {
          var deedLines = deeds.split(/[。！？\n；;]/).filter(function(s) { return s.trim().length > 3; });
          deedLines.slice(0, 2).forEach(function(d, i) {
            var trimmed = d.trim();
            var did = 'deed_' + i;
            var label = trimmed.length > 8 ? trimmed.slice(0, 8) + '…' : trimmed;
            addNode({
              id: did,
              type: 'event',
              label: label,
              desc: trimmed,
              r: 18
            });
            if (nodeIds['goal_frog']) {
              addEdge({ source: did, target: 'goal_frog', type: 'link', label: '今日所为之事' });
            }
          });
        }

        // 明日何进 → 问题/改进节点
        var improvements = extractProblems(reviewData.sanxing[3] || reviewData.sanxing['3'] || '');
        improvements.forEach(function(p) {
          var pid = 'prob_improve_' + p.id;
          addNode({
            id: pid,
            type: 'problem',
            label: p.label,
            desc: p.desc + '（明日欲改进之处）',
            r: 18
          });
          // 改进 → 目标
          if (nodeIds['goal_frog']) {
            addEdge({ source: pid, target: 'goal_frog', type: 'derive', label: '改进以趋近目标' });
          }
        });
      }
    } catch (e) {}

    // ========== 6. 补充知识节点（作为改进方向的锚点）==========
    if (!nodeIds['know_calm']) {
      addNode({ id: 'know_calm', type: 'knowledge', label: '静心之法', desc: '冥想、深呼吸、正念等平静心绪的方法', r: 18 });
    }
    if (!nodeIds['know_action']) {
      addNode({ id: 'know_action', type: 'knowledge', label: '行动优先', desc: '先做五分钟，以行动破思虑', r: 18 });
    }

    // ========== 7. 如果没有任何数据，返回兜底数据 ==========
    if (nodes.length < 3) {
      return getFallbackData();
    }

    return { nodes: nodes, edges: edges };
  }

  // 兜底数据（当没有任何记录时显示）
  function getFallbackData() {
    return {
      nodes: [
        { id: 'g1', type: 'goal', label: '今日目标', desc: '今日想完成的核心目标', r: 24 },
        { id: 'e1', type: 'event', label: '待记录', desc: '记录今日发生的内耗/外耗事件', r: 20 },
        { id: 'm1', type: 'emotion', label: '心境', desc: '今日的情绪与心境', r: 18 },
        { id: 'k1', type: 'knowledge', label: '新知', desc: '今日学到的新知识', r: 18 },
        { id: 'p1', type: 'problem', label: '待改进', desc: '有待改进之处', r: 18 }
      ],
      edges: [
        { source: 'e1', target: 'm1', type: 'cause', label: '事件影响情绪' },
        { source: 'm1', target: 'p1', type: 'link', label: '情绪关联问题' },
        { source: 'p1', target: 'k1', type: 'derive', label: '从问题中学' },
        { source: 'k1', target: 'g1', type: 'derive', label: '新知助目标' }
      ]
    };
  }

  // 暴露到全局
  window.ReviewGraph = {
    generateDynamicGraphData: generateDynamicGraphData
  };

})();
