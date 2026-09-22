/* ============================================
   每日语录库 + 点灯人角色库
   小说语录 · 生活味儿
   ============================================ */

// ---- 每日语录 ----
// 来源：各大小说经典语录
// weight: 出现权重（使用频率）
const DAILY_QUOTES = [
  // ---- 雪中悍刀行 ----
  {
    id: 'x001',
    text: '书上说了，天下没有不散的宴席，但是没关系，书上也说了，人生何处不相逢。',
    source: '雪中悍刀行',
    weight: 3
  },
  {
    id: 'x002',
    text: '江南好，最好是红衣。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x003',
    text: '世间文字八万个，唯有情字最伤人。',
    source: '雪中悍刀行',
    weight: 3
  },
  {
    id: 'x004',
    text: '一起享福是难得的好事，退而求其次，能有人陪着一起吃苦，也不差。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x005',
    text: '人生不如意之事七八九，苦事，终归还能与人言一二三，幸事。',
    source: '雪中悍刀行',
    weight: 3
  },
  {
    id: 'x006',
    text: '人心本炎凉，非世态过错。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x007',
    text: '有些仗，输了后是找不回场子的，男人年纪越大越是如此。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x008',
    text: '多思者必心累，心重者必心苦。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x009',
    text: '有些女子，明知很不好，可就是放不下的。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x010',
    text: '什么叫喜欢一个人？那就是见到对方之前，不知情为何物，错过之后，更不知情为何物。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x011',
    text: '你喜欢我，不需要理由，我不喜欢你，有万般理由，世间情爱，自古辛酸。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x012',
    text: '人生两苦，想要却不得，拥有却失去。',
    source: '雪中悍刀行',
    weight: 3
  },
  {
    id: 'x013',
    text: '遇见你之前，不知道什么叫喜欢，错过你之后，不知道什么叫喜欢。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x014',
    text: '此生来生都愿识尽世间好人，读尽世间好书，看尽世间好山水，天上风景再好，从不羡慕。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x015',
    text: '有些话不说透，自欺欺人，就可以糊涂一世，打打闹闹轻轻松松，可挑明了，便是仙人也断然没有斡旋余地。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x016',
    text: '世事无奈人无奈，能说之时不想说，想说之时已是不能说。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x017',
    text: '天下再大，不过东西南北而已。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x018',
    text: '故事故事，便是故去的事情了，多说无益。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x019',
    text: '天上剑仙三百万，见我也需尽低眉！',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x020',
    text: '江湖恩怨江湖了，江湖儿郎江湖死。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x021',
    text: '骑鹤下江南，才入江湖便出江湖。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x022',
    text: '听闻广陵不知寒，大雪龙骑下江南。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x023',
    text: '你是我的禅，秀色可参。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x024',
    text: '易涨易降大江水，易左易右墙头草，易反易覆小人心。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x025',
    text: '人生当苦无妨，良人当归即好。',
    source: '雪中悍刀行',
    weight: 3
  },
  {
    id: 'x026',
    text: '衣能暖十分，饭可饱七八胃，茶可喝到五六味，就够啦。',
    source: '雪中悍刀行',
    weight: 3
  },
  {
    id: 'x027',
    text: '那日看雪，你从未看我，我从未看雪。',
    source: '雪中悍刀行',
    weight: 3
  },
  {
    id: 'x028',
    text: '想念想念，一经想起便念念不忘了。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x029',
    text: '情不知所起，一往而深，可惜大多由深转浅，相忘江湖。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x030',
    text: '人吃土一辈，土吃人一回。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x031',
    text: '与你相隔，一山又一山。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x032',
    text: '那一次的相遇与相别，就再无相聚了。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x033',
    text: '火大无烟，水顺无声，人之情苦至，极者无语！',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x034',
    text: '他死了，她也死了，世间深情，莫过如此。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x035',
    text: '情之一字，不知所起，不知所栖。不知所结，不知所解。不知所踪，不知所终。不知你所知，我不知所止。',
    source: '雪中悍刀行',
    weight: 2
  },
  {
    id: 'x036',
    text: '有人来时，入江湖，意气风发。去时，出江湖，问心无愧。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x037',
    text: '易事，难事，风雨事，江湖事，王朝事，天下事，都不过一剑的事。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x038',
    text: '我不求道，道自然来。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x039',
    text: '来，给少爷上酒呐。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x040',
    text: '君子德如玉，女子身如玉。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x041',
    text: '自在观观自在，无人在无我在，问此时自家安在，知所在自然自在。',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x042',
    text: '君只见，君只见三十万铁骑甲天下。独不见北凉人，家家户户皆缟素！',
    source: '雪中悍刀行',
    weight: 1
  },
  {
    id: 'x043',
    text: '他叫徐柿子，烂柿子的柿子！',
    source: '雪中悍刀行',
    weight: 1
  },

  // ---- 我真没想重生啊 · 柳岸花又明 ----
  {
    id: 'q101',
    text: '别人都用温柔来形容你，而我却想用你形容温柔。',
    source: '我真没想重生啊 · 陈汉升',
    weight: 2
  },
  {
    id: 'q102',
    text: '我爱你，就像风走了八千里，不问归期。',
    source: '我真没想重生啊 · 萧容鱼',
    weight: 2
  },
  {
    id: 'q103',
    text: '我……我想赚钱给你买辆车。',
    source: '我真没想重生啊 · 沈幼楚',
    weight: 2
  },
  {
    id: 'q104',
    text: '月亮很亮，亮也没用，没用也亮。我喜欢你，喜欢也没用，没用也喜欢。',
    source: '我真没想重生啊 · 罗璇',
    weight: 3
  },
  {
    id: 'q105',
    text: '你永远是沈幼楚，我保证不和他抢，只要你能抽空来陪我一下就好，一点点时间就好。',
    source: '我真没想重生啊 · 商妍妍',
    weight: 2
  },
  {
    id: 'q106',
    text: '你静姐不在，有什么事情呼叫媞哥。',
    source: '我真没想重生啊 · 郑观媞',
    weight: 1
  },
  {
    id: 'q107',
    text: '我从银行出来之后，想灌我酒的男人不知道有多少，但是记得帮我热牛奶的男人只有这一个。',
    source: '我真没想重生啊 · 孔静',
    weight: 2
  },
  {
    id: 'q108',
    text: '人性其实很有趣啊。不管是男生还是女生，他们一般不会记住跋山涉水见自己的人，只会记得自己跋山涉水去见过的人。简单的说，就是对自己的付出印象深刻，很难想起别人对自己的好。',
    source: '我真没想重生啊 · 陈汉升',
    weight: 3
  },
  {
    id: 'q109',
    text: '成人的名利场总是少不了逢场作戏，谁当真谁就是傻瓜。',
    source: '我真没想重生啊',
    weight: 2
  },
  {
    id: 'q110',
    text: '古今中外，背井离乡讨生活的人们，有的富足，也有的穷困，但无论是富足还是穷苦，心中的离愁却是永远难以磨灭的。',
    source: '我真没想重生啊',
    weight: 2
  },
  {
    id: 'q111',
    text: '喜欢她的那么多，你也就是一个枉死鬼。',
    source: '我真没想重生啊',
    weight: 1
  },
  {
    id: 'q112',
    text: '考上大学就已经是成年人了，独自难受是成年人的优秀品质。',
    source: '我真没想重生啊',
    weight: 2
  },
  {
    id: 'q113',
    text: '还是高中舒服啊，可惜老子已经毕业了！',
    source: '我真没想重生啊',
    weight: 1
  },
  {
    id: 'q116',
    text: '这个世界总是不缺少努力的人，兢兢业业，但是收获远没有想象那么多。其实，如果他们肯在百忙中抬起头，抽点时间观察和思考，开阔自己的心胸，吸收周围环境的反馈，也许人生还能更加辉煌。',
    source: '我真没想重生啊',
    weight: 2
  },

  // ---- 剑来（挑有生活味儿的）----
  {
    id: 'j001',
    text: '遇事不决，可问春风。春风不语，即随本心。',
    source: '剑来',
    weight: 2
  },
  {
    id: 'j002',
    text: '人生不是书上的故事，喜怒哀乐，悲欢离合，都在书页间，可书页翻篇何其易，人心修补何其难。',
    source: '剑来',
    weight: 2
  },
  {
    id: 'j003',
    text: '长大不是慢悠悠的岁月变迁，不是从一个地方走到另一个地方，往往只是一瞬间的事情。',
    source: '剑来',
    weight: 2
  },
  {
    id: 'j004',
    text: '有些可做可不做的事情，做了，会让自己心安些，那就不用犹豫了。',
    source: '剑来',
    weight: 2
  },
  {
    id: 'j005',
    text: '我觉得有些心坎，一辈子都留在心路上，抹不平，只能偷偷绕过去，没什么不好。',
    source: '剑来',
    weight: 2
  },
  {
    id: 'j006',
    text: '这个世道给予你一份善意，不是有一天当世道又给予我恶意之后，哪怕这个恶意远远大于善意，我就要全盘否定这个世界。那点善意还在的，记住，抓住，时时记起。',
    source: '剑来',
    weight: 2
  },
  {
    id: 'j007',
    text: '与妙人为友，如醉鬼饮醇酒，哪有清醒的可能，岂有不醉的道理？',
    source: '剑来',
    weight: 1
  },

  // ---- 其他小说 ----
  {
    id: 'o001',
    text: '桃李春风一杯酒，江湖夜雨十年灯。我们只是，好久不见。',
    source: '盗墓笔记·十年',
    weight: 3
  },
  {
    id: 'o002',
    text: '数人世相逢，百年欢笑，能得几回又。',
    source: '我家老婆来自一千年前',
    weight: 2
  },
  {
    id: 'o003',
    text: '时光正温柔，而岁月还长。',
    source: '你是不是喜欢我',
    weight: 2
  },
  {
    id: 'o004',
    text: '人生何必常相伴，遥以相思寄东风。',
    source: '二哈和他的白猫师尊',
    weight: 2
  },
  {
    id: 'o005',
    text: '你看这个人，嘴里说着喜欢我却又让我这么难过。',
    source: '我等你到三十五岁',
    weight: 2
  },
  {
    id: 'o006',
    text: '这里的一切都有始有终，却能容纳所有不期而遇和久别重逢。世界灿烂盛大，欢迎回家。',
    source: '全球高考',
    weight: 3
  }
];

// ---- 点灯人角色 ----
const LIGHT_KEEPERS = [
  {
    id: 'chen-ping-an',
    name: '陈平安',
    title: '草鞋少年 · 文圣弟子',
    avatar: '🗡️',
    style: '温和坚定，循循善诱，喜欢讲道理，一板一眼，常以"我少年时"开头',
    signature: '遇事不决，可问春风。',
    knowledge: ['心理学', '伦理学', '成长型思维', '正念'],
    color: '#8b6914'
  },
  {
    id: 'ning-yao',
    name: '宁姚',
    title: '剑气长城 · 天才剑修',
    avatar: '⚔️',
    style: '干脆利落，直来直去，不绕弯子，话不多但句句戳心',
    signature: '我宁姚的道理，就是我的剑。',
    knowledge: ['认知行为', '决断力', '边界感'],
    color: '#c9a227'
  },
  {
    id: 'wen-sheng',
    name: '文圣',
    title: '三四之争 · 醇儒',
    avatar: '📜',
    style: '博学多识，旁征博引，喜欢用比喻和典故，循循然善诱人',
    signature: '道之所存，师之所存也。',
    knowledge: ['哲学', '逻辑学', '历史', '教育学'],
    color: '#6b5d44'
  },
  {
    id: 'a-liang',
    name: '阿良',
    title: '江湖剑客 · 不羁之士',
    avatar: '🍶',
    style: '洒脱不羁，嬉笑怒骂皆成文章，用最轻松的语气讲最深刻的道理',
    signature: '好人就该有好报，不是吗？',
    knowledge: ['博弈论', '社会心理学', '人生智慧'],
    color: '#3d7a74'
  },
  {
    id: 'wu-zhi-hong',
    name: '武志红',
    title: '心理学家',
    avatar: '🧠',
    style: '深度剖析心理动力，从原生家庭、关系模式入手，温和而犀利',
    signature: '成为你自己。',
    knowledge: ['精神分析', '依恋理论', '关系心理学', '自我成长'],
    color: '#4a6fa5'
  },
  {
    id: 'li-mei-jin',
    name: '李玫瑾',
    title: '犯罪心理学教授',
    avatar: '🔍',
    style: '理性冷静，从行为分析性格成因，逻辑清晰，一针见血',
    signature: '性格决定命运，而性格的底色，在早年。',
    knowledge: ['发展心理学', '行为分析', '家庭教育'],
    color: '#7a5c8a'
  },
  {
    id: 'chen-bo',
    name: '陈波',
    title: '北大哲学 · 逻辑学',
    avatar: '📐',
    style: '严谨逻辑，概念清晰，善于拆解谬误，构建论证',
    signature: '未经审视的人生不值得过。',
    knowledge: ['逻辑学', '批判性思维', '哲学分析'],
    color: '#2d6a4f'
  },
  {
    id: 'li-chun-gang',
    name: '李淳罡',
    title: '剑神 · 青衫仗剑',
    avatar: '☯️',
    style: '豪迈通透，大道至简，一句话点破万种玄机',
    signature: '天不生我李淳罡，剑道万古如长夜。',
    knowledge: ['境界提升', '心学', '顿悟'],
    color: '#922b21'
  }
];

// ---- 语录选取逻辑 ----
// 每日随机一条，当天不重复；结合使用频率权重
function getDailyQuote() {
  const today = new Date().toDateString();
  const storageKey = 'okr_daily_quote';
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (data.date === today && data.quote) {
        // 同一天返回同一条
        return data.quote;
      }
    } catch (e) { /* ignore */ }
  }

  // 加权随机
  const totalWeight = DAILY_QUOTES.reduce((sum, q) => sum + q.weight, 0);
  let random = Math.random() * totalWeight;
  let selected = DAILY_QUOTES[0];

  for (const quote of DAILY_QUOTES) {
    random -= quote.weight;
    if (random <= 0) {
      selected = quote;
      break;
    }
  }

  // 记录使用次数（权重调整用）
  const usageKey = 'okr_quote_usage';
  let usage = {};
  try { usage = JSON.parse(localStorage.getItem(usageKey) || '{}'); } catch (e) {}
  usage[selected.id] = (usage[selected.id] || 0) + 1;
  localStorage.setItem(usageKey, JSON.stringify(usage));

  // 保存今日语录
  localStorage.setItem(storageKey, JSON.stringify({
    date: today,
    quote: selected
  }));

  return selected;
}

// 手动换一条（不能是今天已经出现过的）
function changeQuote() {
  const today = new Date().toDateString();
  const storageKey = 'okr_daily_quote';
  const seenKey = 'okr_quote_seen';

  let seenToday = [];
  try {
    const seen = JSON.parse(localStorage.getItem(seenKey) || '{}');
    if (seen.date === today) seenToday = seen.ids || [];
  } catch (e) {}

  // 排除今天已经出现的
  const available = DAILY_QUOTES.filter(q => !seenToday.includes(q.id));
  if (available.length === 0) {
    // 今天全部看完了，重置
    seenToday = [];
  }

  const pool = available.length > 0 ? available : DAILY_QUOTES;

  // 加权随机
  const totalWeight = pool.reduce((sum, q) => sum + q.weight, 0);
  let random = Math.random() * totalWeight;
  let selected = pool[0];
  for (const quote of pool) {
    random -= quote.weight;
    if (random <= 0) { selected = quote; break; }
  }

  seenToday.push(selected.id);
  localStorage.setItem(seenKey, JSON.stringify({ date: today, ids: seenToday }));
  localStorage.setItem(storageKey, JSON.stringify({ date: today, quote: selected }));

  return selected;
}
