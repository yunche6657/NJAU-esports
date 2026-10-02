/* ==========================================================================
 * NJAU 电竞社 · 本地兜底数据 + 后端动态配置
 * --------------------------------------------------------------------------
 * 未来对接后端（契约见《NJAU电竞社官网_需求规格》§7），数据结构预留如下：
 *
 *   GET /api/config  ->  {
 *     games: [                       // 游戏分部，顺序即展示顺序（严格 8 个）
 *       { id: "valorant",            // 唯一标识
 *         name: "瓦罗兰特",           // 中文名
 *         name_en: "VALORANT",       // 英文名
 *         theme: "#ff5d73" },        // 主题色 hex（前端用作 --gc）
 *       ...
 *     ],
 *     group_qr: "/assets/qr-main.png",   // 社团大群二维码图地址
 *     about: {
 *       intro: "社团简介富文本/纯文本",
 *       stats: [ { label: "社员", value: 128, suffix: "+" }, ... ]
 *     }
 *   }
 *   GET /api/activities -> [ { id, title, date, cover, desc } ]
 *   GET /api/honors     -> [ { id, title, date, tag, desc } ]
 *   POST /api/apply     ->  body: { name, major, games: [id...], contact, intro }
 *   GET /api/apply/stats->  { "valorant": 12, ... }   // 仅统计数
 *
 * 本地预览优先请求 http://127.0.0.1:8787/api/config；部署后请求同源 /api/config。
 * 请求失败、超时或契约不匹配时沿用下面的本地兜底数据。
 * ========================================================================== */
window.NJAUEC_DATA = {
  mainGroup: {
    name: '南农电竞社招新群', number: '912557320',
    url: 'https://qm.qq.com/q/EUctC3oqmk', qr: 'assets/bloom/group-code.png'
  },
  // QQ group numbers and QR images supplied by the club. Invitation URLs are
  // separate data: a group number alone does not prove a working invite URL.
  divisionGroups: {
    valorant: { name: '南农瓦友社群', number: '779228196', url: 'https://qm.qq.com/q/516K7eHsDS', qr: 'assets/division-qr/valorant.png' },
    cs2: { name: '南农 CS 交流群', number: '1040043500', url: 'https://qm.qq.com/q/eVaJQq8Xgk', qr: 'assets/division-qr/cs2.png' },
    wangzhe: { name: '南农王者荣耀交流群', number: '657396022', url: 'https://qm.qq.com/q/Gcl08cmhea', qr: 'assets/division-qr/wangzhe.png' },
    delta: { name: '三角洲行动分部群', number: '937964194', url: 'https://qm.qq.com/q/Ln72SEjnUG', qr: 'assets/division-qr/delta.png' },
    naraka: { name: '嘴比刀硬', number: '974951023', url: 'https://qm.qq.com/q/ytV8wBL1xC', qr: 'assets/division-qr/naraka.png' },
    identityv: { name: 'NJAU 第五养老庄园', number: '1015340750', url: 'https://qm.qq.com/q/GoTAgkdF00', qr: 'assets/division-qr/identityv.png' },
    overwatch: { name: '南农守望先锋分部', number: '884633499', url: 'https://qm.qq.com/q/jjHfW0AS2I', qr: 'assets/division-qr/overwatch.png' },
    lol: { name: '南农 LOL', number: '871141005', url: 'https://qm.qq.com/q/9ABlUeLB1m', qr: 'assets/division-qr/lol.png' }
  },
  games: [
    { id: "valorant", name: "瓦罗兰特", name_en: "VALORANT", theme: "#ff5d73",
      desc: "五人并肩攻防，练枪、研究战术，也一起打校赛。",
      characters: [
        "assets/valorant/character-01-fx.png?v=20260925-noline4",
        "assets/valorant/character-02-fx.png?v=20260925-noline4",
        "assets/valorant/character-03-fx.png?v=20260925-noline3"
      ] },
    { id: "cs2", name: "CS2", name_en: "COUNTER-STRIKE 2", theme: "#ff9f45",
      desc: "从跑图与道具配合开始，和队友打好每一回合。",
      characters: [
        "assets/cs2/character-01.png",
        "assets/cs2/character-02.png",
        "assets/cs2/character-03.png"
      ] },
    { id: "wangzhe", name: "王者荣耀", name_en: "HONOR OF KINGS", theme: "#ffd166",
      desc: "开黑练配合，组队冲分，也为校赛磨合阵容。",
      characters: [
        "assets/wangzhe/character-01.png",
        "assets/wangzhe/character-02.png",
        "assets/wangzhe/character-03.png"
      ] },
    { id: "delta", name: "三角洲行动", name_en: "DELTA FORCE", theme: "#2ec4b6",
      desc: "搜物资、做决策、稳撤离；也能一起投入大战场。",
      characters: [
        "assets/delta/character-01.png",
        "assets/delta/character-02.png",
        "assets/delta/character-03.png"
      ] },
    { id: "naraka", name: "永劫无间", name_en: "NARAKA: BLADEPOINT", theme: "#4cc9f0",
      desc: "练振刀与连招，组起三排，在刀锋间打出默契。",
      characters: [
        "assets/naraka/character-01.png",
        "assets/naraka/character-02.png",
        "assets/naraka/character-03.png"
      ] },
    { id: "identityv", name: "第五人格", name_en: "IDENTITY V", theme: "#9b8cff",
      desc: "求生者并肩破局，监管者追逐博弈，双阵营都欢迎。",
      characters: [
        "assets/identityv/character-01.png",
        "assets/identityv/character-02.png?v=2",
        "assets/identityv/character-03.png"
      ] },
    { id: "overwatch", name: "守望先锋", name_en: "OVERWATCH", theme: "#f99e1a",
      desc: "选好英雄、连起技能，团队协作决定每场胜负。",
      characters: [
        "assets/overwatch/character-01-genji.png?v=20260927-pixel-roster",
        "assets/overwatch/character-02-mccree.png?v=20260927-pixel-roster",
        "assets/overwatch/character-03.png?v=20260927-pixel-roster"
      ] },
    { id: "lol", name: "LOL", name_en: "LEAGUE OF LEGENDS", theme: "#c77dff",
      desc: "从对线到团战，五个位置一起磨合，峡谷不缺队友。",
      characters: [
        "assets/lol/character-01-a.png",
        "assets/lol/character-02.png",
        "assets/lol/character-03.png"
      ] }
  ],
  stats: [
    { label: "注册社员", value: 128, suffix: "+" },
    { label: "游戏分部", value: 8, suffix: "" },
    { label: "活动举办", value: 10, suffix: "" },
    { label: "奖杯奖牌", value: 6, suffix: "" }
  ],
  events: [
    { date: "常规赛事", title: "社团内部对抗赛 & Scrim 训练", desc: "八大游戏分部定期举办队内对抗与高校训练赛，磨合阵容打法，提升团队协作。" },
    { date: "年度盛典", title: "校园电竞节 & 水友互动赛", desc: "面向全校游戏爱好者的线下交流与水友对黑，体验电竞氛围并结识同好。" },
    { date: "学期迎新", title: "新生破冰赛 & 训练营交流", desc: "开学季新社员破冰开黑与分部选拔，帮助各年级新同学快速找到同行队友。" }
  ],
  honors: [
    {
      id: "cs2-jd-major-2026",
      title: "京东MALL 第三届 CS2 校园Major",
      rank: "亚军",
      rank_type: "silver",
      tag: "CS2",
      cover: "assets/honors/jd-cs2-major.jpg",
      desc: "出征京东MALL第三届CS2校园Major，历经线上多轮角逐与线下总决赛强强对抗，斩获南京赛区亚军！展现了强悍的竞技韧性与关键局执行力。"
    },
    {
      id: "cs2-pegt-2026",
      title: "PEGT 高校电竞联赛 · 南京站",
      rank: "亚军",
      rank_type: "silver",
      tag: "CS2",
      cover: "assets/honors/pegt-cs2-runnerup.jpg",
      desc: "斩获 PEGT 高校联赛南京站 CS2 亚军！同年持续出征多项重点高校赛事：荣获 2026 卓威春季高校赛四强、秋季卓威高校赛亚军（南京赛点），及极限之地公开赛南京六强。"
    },
    {
      id: "val-pegt-2026",
      title: "PEGT 高校电竞联赛 · 南京站",
      rank: "亚军",
      rank_type: "silver",
      tag: "无畏契约",
      cover: "assets/honors/pegt-val-runnerup.jpg",
      desc: "2026 PEGT 全国高校电竞联赛南京站线下总决赛，南农无畏契约战队高光出战，于大舞台敢打敢拼，勇夺无畏契约项目南京站亚军！"
    },
    {
      id: "val-sandisk-2026",
      title: "闪迪高校开黑挑战赛",
      rank: "季军",
      rank_type: "bronze",
      tag: "无畏契约",
      cover: "assets/honors/sandisk-val-third.jpg",
      desc: "出征 2026 年度闪迪高校开黑挑战赛（Sandisk Gamer Day），在激烈的全国高校战队对抗中稳定发挥、突破重围，斩获高校赛季军！"
    }
  ]
};

(function () {
  var data = window.NJAUEC_DATA;
  var localPreview = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') && location.port === '4173';
  var apiBase = localPreview ? 'http://127.0.0.1:8787' : '';
  var controller = typeof AbortController === 'function' ? new AbortController() : null;
  var timeout;
  var expired = false;
  var request = fetch(apiBase + '/api/config', controller ? { signal: controller.signal } : {})
    .then(function (response) {
      if (!response.ok) throw new Error('配置接口返回 ' + response.status);
      return response.json();
    })
    .then(function (config) {
      if (expired) return false;
      if (!config || !Array.isArray(config.games)) throw new Error('配置缺少 games 列表');
      var expected = data.games.map(function (game) { return game.id; });
      var incoming = config.games.map(function (game) { return game && game.id; });
      if (incoming.length !== expected.length || expected.some(function (id) { return incoming.indexOf(id) === -1; })) {
        throw new Error('配置中的游戏分部与前端八个分部不匹配');
      }

      var byId = {};
      config.games.forEach(function (game) { byId[game.id] = game; });
      data.games = data.games.map(function (fallback) {
        var remote = byId[fallback.id];
        var theme = /^#[\da-f]{6}$/i.test(remote.theme || '') ? remote.theme : fallback.theme;
        return Object.assign({}, fallback, {
          name: typeof remote.name === 'string' ? remote.name : fallback.name,
          name_en: typeof remote.name_en === 'string' ? remote.name_en : fallback.name_en,
          theme: theme
        });
      });

      config.games.forEach(function (game) {
        var group = game.group;
        if (!group || !data.divisionGroups[game.id]) return;
        data.divisionGroups[game.id] = Object.assign({}, data.divisionGroups[game.id], {
          name: typeof group.name === 'string' ? group.name : data.divisionGroups[game.id].name,
          number: typeof group.number === 'string' ? group.number : data.divisionGroups[game.id].number,
          url: typeof group.url === 'string' ? group.url : data.divisionGroups[game.id].url,
          qr: typeof game.qr === 'string' ? game.qr : data.divisionGroups[game.id].qr
        });
      });

      var mainGroup = config.about && config.about.main_group;
      if (mainGroup && typeof mainGroup === 'object') {
        data.mainGroup = Object.assign({}, data.mainGroup, mainGroup);
      }
      if (Array.isArray(config.stats) && config.stats.length) {
        data.stats = data.stats.map(function (fallback, index) {
          var remote = config.stats[index];
          return remote && Number.isFinite(Number(remote.value))
            ? Object.assign({}, fallback, remote, { value: Number(remote.value) })
            : fallback;
        });
      }
      return true;
    });

  var deadline = new Promise(function (_, reject) {
    timeout = setTimeout(function () {
      expired = true;
      if (controller) controller.abort();
      reject(new Error('配置接口超时'));
    }, 2000);
  });

  window.NJAUEC_DATA_READY = Promise.race([request, deadline])
    .catch(function (error) {
      console.info('NJAUEC: 使用本地配置兜底。', error.message);
      return false;
    })
    .then(function (loaded) {
      clearTimeout(timeout);
      return loaded;
    });
})();
