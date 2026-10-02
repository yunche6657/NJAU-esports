'use strict';

/**
 * NJAU 电竞社官网后端 —— Cloudflare Worker 版（M3）
 * ------------------------------------------------------------------
 * 与 site/backend/server.js（Node 版）契约完全一致：
 *   GET  /api/config        站点配置（站名/标语/简介/大群/7 分部）
 *   GET  /api/activities    历史活动（M1 返回 []）
 *   GET  /api/honors        战报荣誉（M1 返回 []）
 *   POST /api/apply         提交报名（写入 D1）
 *   GET  /api/apply/stats   各分部报名统计
 *   GET  /api/apply/list    【管理】全部报名（需 Authorization: Bearer <ADMIN_KEY>）
 *                           ?format=csv 导出 CSV
 *
 * 数据：Cloudflare D1（SQLite），表结构见 schema.sql。
 * 密钥：ADMIN_KEY 通过 `wrangler secret put ADMIN_KEY` 设置。
 */

/* ==================================================================
 * 1. 站点配置（与 Node 版 server.js 完全一致，id/主题色/群信息）
 * ================================================================== */

const GAMES = [
  { id: 'valorant',  name: '瓦罗兰特',   name_en: 'VALORANT',           theme: '#ff5d73', qr: '/assets/division-qr/valorant.png',  order: 1,
    group: { name: '南农瓦友社群',        number: '779228196',  url: 'https://qm.qq.com/q/516K7eHsDS' } },
  { id: 'cs2',       name: 'CS2',        name_en: 'Counter-Strike 2',   theme: '#ff9f45', qr: '/assets/division-qr/cs2.png',       order: 2,
    group: { name: '南农 CS 交流群',      number: '1040043500', url: 'https://qm.qq.com/q/eVaJQq8Xgk' } },
  { id: 'wangzhe',   name: '王者荣耀',   name_en: 'Honor of Kings',     theme: '#ffd166', qr: '/assets/division-qr/wangzhe.png',   order: 3,
    group: { name: '南农王者荣耀交流群',  number: '657396022',  url: 'https://qm.qq.com/q/Gcl08cmhea' } },
  { id: 'delta',     name: '三角洲行动', name_en: 'Delta Force',        theme: '#2ec4b6', qr: '/assets/division-qr/delta.png',     order: 4,
    group: { name: '三角洲行动分部群',    number: '937964194',  url: 'https://qm.qq.com/q/Ln72SEjnUG' } },
  { id: 'naraka',    name: '永劫无间',   name_en: 'NARAKA: Bladepoint', theme: '#4cc9f0', qr: '/assets/division-qr/naraka.png',    order: 5,
    group: { name: '嘴比刀硬',            number: '974951023',  url: 'https://qm.qq.com/q/ytV8wBL1xC' } },
  { id: 'identityv', name: '第五人格',   name_en: 'Identity V',         theme: '#9b8cff', qr: '/assets/division-qr/identityv.png', order: 6,
    group: { name: 'NJAU 第五养老庄园',   number: '1015340750', url: 'https://qm.qq.com/q/GoTAgkdF00' } },
  { id: 'overwatch', name: '守望先锋',   name_en: 'Overwatch',          theme: '#f99e1a', qr: '/assets/division-qr/overwatch.png', order: 7,
    group: { name: '南农守望先锋分部',    number: '884633499',   url: 'https://qm.qq.com/q/jjHfW0AS2I' } },
  { id: 'lol',       name: 'LOL',        name_en: 'League of Legends',  theme: '#c77dff', qr: '/assets/division-qr/lol.png',       order: 8,
    group: { name: '南农 LOL',            number: '871141005',  url: 'https://qm.qq.com/q/9ABlUeLB1m' } },
];

const GAME_IDS = new Set(GAMES.map((g) => g.id));
const GAME_ID_LIST = GAMES.map((g) => g.id);

const CONFIG = {
  site: {
    name: 'NJAU 电竞社',
    slogan: '以热爱之名，为荣耀而战 —— 青春不打烊，电竞不散场。',
  },
  about: {
    text: 'NJAU 电竞社由热爱游戏的南农同学组成。八个游戏分部汇聚不同玩法，从校队训练、组队开黑到观赛交流，都有人与你并肩。',
    main_group: {
      name: '南农电竞社招新群',
      number: '912557320',
      url: 'https://qm.qq.com/q/EUctC3oqmk',
      qr: '/assets/bloom/group-code.png',
    },
    main_group_qr: '/assets/bloom/group-code.png',
  },
  stats: [
    { label: '注册社员', value: 128, suffix: '+' },
    { label: '游戏分部', value: 8,   suffix: '' },
    { label: '活动举办', value: 10,  suffix: '' },
    { label: '奖杯奖牌', value: 6,  suffix: '' },
  ],
  games: GAMES,
};

/* ==================================================================
 * 2. 工具函数
 * ================================================================== */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  });
}

const MAX_BODY_BYTES = 64 * 1024;

async function readJsonBody(request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY_BYTES) {
    const err = new Error('body too large');
    err.statusCode = 413;
    throw err;
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    const err = new Error('body too large');
    err.statusCode = 413;
    throw err;
  }
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return { error: { body: '请求体不是合法的 JSON' } };
  }
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { error: { body: '请求体必须是 JSON 对象' } };
  }
  return { input };
}

/* ==================================================================
 * 3. 报名：校验 + 写入 D1
 * ================================================================== */

function validateApplication(input) {
  const errors = {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const grade = typeof input.grade === 'string' ? input.grade.trim() : '';
  const contact = typeof input.contact === 'string' ? input.contact.trim() : '';

  if (!name) errors.name = '姓名（name）为必填项';
  else if (name.length > 50) errors.name = '姓名（name）最长 50 个字符';

  if (grade && grade.length > 30) errors.grade = '年级（grade）最长 30 个字符';

  if (!contact) errors.contact = '联系方式（contact，微信/QQ 等）为必填项';
  else if (contact.length > 100) errors.contact = '联系方式（contact）最长 100 个字符';

  let major = '';
  if (input.major !== undefined && input.major !== null) {
    if (typeof input.major !== 'string') errors.major = '专业（major）须为字符串';
    else { major = input.major.trim(); if (major.length > 100) errors.major = '年级 / 专业最长 100 个字符'; }
  }

  let intro = '';
  if (input.intro !== undefined && input.intro !== null) {
    if (typeof input.intro !== 'string') errors.intro = '自我介绍（intro）须为字符串';
    else { intro = input.intro.trim(); if (intro.length > 2000) errors.intro = '自我介绍最长 2000 个字符'; }
  }

  let games = [];
  if (!Array.isArray(input.games)) {
    errors.games = '意向分部（games）必须是非空数组';
  } else if (input.games.length === 0) {
    errors.games = '意向分部（games）至少选择一项';
  } else {
    const seen = new Set();
    for (const g of input.games) {
      if (typeof g !== 'string' || !GAME_IDS.has(g)) {
        errors.games = '意向分部包含非法游戏 id「' + String(g) + '」，合法值：' + GAME_ID_LIST.join(' / ');
        break;
      }
      seen.add(g);
    }
    if (!errors.games) games = [...seen];
  }

  return { errors, value: { name, grade, major, games, contact, intro } };
}

async function handleApply(request, env) {
  const { input, error } = await readJsonBody(request);
  if (error) return json({ ok: false, errors: error }, 400);

  const { errors, value } = validateApplication(input);
  if (Object.keys(errors).length > 0) return json({ ok: false, errors }, 400);

  const createdAt = new Date().toISOString();
  const result = await env.DB.prepare(
    'INSERT INTO applications (name, grade, major, games, contact, intro, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(value.name, value.grade, value.major, JSON.stringify(value.games), value.contact, value.intro, createdAt)
    .run();

  return json({ ok: true, id: result.meta.last_row_id });
}

async function handleStats(env) {
  const { results } = await env.DB.prepare('SELECT games FROM applications').all();
  const byGame = Object.fromEntries(GAMES.map((g) => [g.id, 0]));
  for (const row of results) {
    let arr = [];
    try { arr = JSON.parse(row.games); } catch { /* ignore */ }
    if (Array.isArray(arr)) {
      for (const g of arr) {
        if (Object.prototype.hasOwnProperty.call(byGame, g)) byGame[g] += 1;
      }
    }
  }
  const totalRes = await env.DB.prepare('SELECT COUNT(*) AS n FROM applications').first();
  return json({ total: totalRes ? totalRes.n : 0, by_game: byGame });
}

/* ==================================================================
 * 4. 管理接口：查看全部报名（Bearer 鉴权）+ CSV 导出
 * ================================================================== */

function checkAdmin(request, env) {
  const key = env.ADMIN_KEY || '';
  if (!key) return false; // 未配置密钥时一律拒绝
  const auth = request.headers.get('Authorization') || '';
  return auth === 'Bearer ' + key;
}

function csvEscape(s) {
  s = String(s == null ? '' : s);
  // Keep submitted values as text when opened in spreadsheet applications.
  if (/^[\s]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

async function handleList(request, env, url) {
  if (!checkAdmin(request, env)) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }
  const { results } = await env.DB.prepare(
    'SELECT id, name, grade, major, games, contact, intro, created_at FROM applications ORDER BY id'
  ).all();

  if (url.searchParams.get('format') === 'csv') {
    const header = ['id', '姓名', '年级', '专业', '意向分部', '联系方式', '自我介绍', '提交时间'];
    const lines = ['﻿' + header.map(csvEscape).join(',')];
    for (const r of results) {
      let games = r.games;
      try {
        const arr = JSON.parse(r.games);
        if (Array.isArray(arr)) games = arr.join(' ');
      } catch { /* keep raw */ }
      lines.push([r.id, r.name, r.grade, r.major, games, r.contact, r.intro, r.created_at].map(csvEscape).join(','));
    }
    return new Response(lines.join('\r\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="applications.csv"',
        ...CORS_HEADERS,
      },
    });
  }

  const applications = results.map((r) => {
    let games = [];
    try { games = JSON.parse(r.games); } catch { /* ignore */ }
    return { id: r.id, name: r.name, grade: r.grade, major: r.major, games, contact: r.contact, intro: r.intro, created_at: r.created_at };
  });
  return json({ ok: true, total: applications.length, applications });
}

/* ==================================================================
 * 5. 路由
 * ================================================================== */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (!path.startsWith('/api/') && env.ASSETS) return env.ASSETS.fetch(request);

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      if (method === 'GET' && path === '/api/config') return json(CONFIG);
      if (method === 'GET' && path === '/api/activities') return json([]);
      if (method === 'GET' && path === '/api/honors') return json([]);
      if (method === 'GET' && path === '/api/apply/stats') return await handleStats(env);
      if (method === 'GET' && path === '/api/apply/list') return await handleList(request, env, url);
      if (method === 'POST' && path === '/api/apply') return await handleApply(request, env);

      return json({ ok: false, error: 'Not Found' }, 404);
    } catch (err) {
      if (err && err.statusCode === 413) {
        return json({ ok: false, error: '请求体过大（上限 64KB）' }, 413);
      }
      return json({ ok: false, error: 'Internal Server Error' }, 500);
    }
  },
};
