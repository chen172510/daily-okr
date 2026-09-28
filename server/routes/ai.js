/* ============================================
   行醒后端 · AI 代理层

   目的：API Key 只放在服务器上，前端永远拿不到，
        同时给每个用户加每日次数上限，避免被刷爆额度。

   环境变量（都可以不配，不配就是「本地演示模式」，一分钱不花）：
     AI_API_KEY     第三方 key（DeepSeek / 通义 / Kimi / 硅基流动…）
     AI_BASE_URL    OpenAI 兼容的接口地址，默认 https://api.deepseek.com
     AI_MODEL       模型名，默认 deepseek-chat
     AI_DAILY_LIMIT 每人每天最多几次，默认 20
     AI_MAX_TOKENS  单次回复最大 token，默认 600（越少越便宜）

   换厂商时只需要改 AI_BASE_URL / AI_MODEL，代码不用动。
   ============================================ */

const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const AI_KEY = process.env.AI_API_KEY || '';
const AI_BASE_URL = (process.env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
const AI_MODEL = process.env.AI_MODEL || 'deepseek-chat';
const DAILY_LIMIT = Math.max(1, parseInt(process.env.AI_DAILY_LIMIT || '20', 10));
const MAX_TOKENS = Math.max(64, parseInt(process.env.AI_MAX_TOKENS || '600', 10));
const TIMEOUT_MS = 30000;

// 每个用户每天用了几次（内存计数，重启归零；目的是省钱，不需要落库）
const usageMap = new Map();

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function usedToday(userId) {
  const key = todayStr() + ':' + userId;
  return usageMap.get(key) || 0;
}

function addUsage(userId) {
  const key = todayStr() + ':' + userId;
  const n = (usageMap.get(key) || 0) + 1;
  usageMap.set(key, n);
  // 顺手清理不是今天的记录，避免内存一直涨
  if (usageMap.size > 500) {
    const today = todayStr();
    for (const k of usageMap.keys()) if (!k.startsWith(today)) usageMap.delete(k);
  }
  return n;
}

// 前端先问一下是否配好了 AI，好决定用真模型还是本地演示话术
router.get('/ai/status', authMiddleware, (req, res) => {
  res.json({
    configured: !!AI_KEY,
    model: AI_KEY ? AI_MODEL : null,
    dailyLimit: DAILY_LIMIT,
    usedToday: usedToday(req.user.id),
    remaining: Math.max(0, DAILY_LIMIT - usedToday(req.user.id)),
    maxTokens: MAX_TOKENS
  });
});

router.post('/ai/chat', authMiddleware, async (req, res) => {
  if (!AI_KEY) {
    // 没配 key：明确告诉前端「用本地模式」，这样不花钱也能演示
    return res.status(503).json({
      error: 'AI_NOT_CONFIGURED',
      message: '还没有配置 AI Key，当前使用本地演示话术。'
    });
  }

  if (typeof fetch !== 'function') {
    return res.status(500).json({
      error: 'NODE_TOO_OLD',
      message: '服务端 Node 版本过低（需要 18 及以上）才能调用 AI。'
    });
  }

  const userId = req.user.id;
  const used = usedToday(userId);
  if (used >= DAILY_LIMIT) {
    return res.status(429).json({
      error: 'DAILY_LIMIT',
      message: '今天的 AI 次数用完了（每天 ' + DAILY_LIMIT + ' 次），明天再来，或者先用本地话术。',
      dailyLimit: DAILY_LIMIT,
      usedToday: used
    });
  }

  // 只取最近若干条，控制 token 消耗
  const incoming = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];
  const trimmed = incoming
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-8)
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (!trimmed.length) {
    return res.status(400).json({ error: 'EMPTY_MESSAGE', message: '没有收到内容。' });
  }

  const persona = (req.body && typeof req.body.persona === 'string') ? req.body.persona.slice(0, 800) : '';
  const systemPrompt = persona
    ? persona
    : '你是「理想的我」，一位温和、务实、不说教成长伙伴。用中文回答，先共情，再给可执行的一两条建议，控制在 200 字以内。';

  const payload = {
    model: AI_MODEL,
    messages: [{ role: 'system', content: systemPrompt }].concat(trimmed),
    max_tokens: MAX_TOKENS,
    temperature: 0.7,
    stream: false
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resp = await fetch(AI_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + AI_KEY
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const msg = (data && data.error && data.error.message) || ('接口返回 ' + resp.status);
      console.error('[AI] 调用失败：', resp.status, msg);
      return res.status(502).json({ error: 'UPSTREAM_ERROR', message: 'AI 接口调用失败：' + msg });
    }

    const reply = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';

    const count = addUsage(userId);

    res.json({
      reply: reply || '（这次没有生成内容，再说一次试试）',
      model: AI_MODEL,
      usage: data.usage || null,
      usedToday: count,
      remaining: Math.max(0, DAILY_LIMIT - count)
    });
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    console.error('[AI] 请求异常：', err && err.message);
    res.status(aborted ? 504 : 500).json({
      error: aborted ? 'TIMEOUT' : 'REQUEST_FAILED',
      message: aborted ? 'AI 响应超时，稍后再试。' : 'AI 请求异常，稍后再试。'
    });
  } finally {
    clearTimeout(timer);
  }
});

module.exports = router;
