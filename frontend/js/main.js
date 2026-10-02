/* ==========================================================================
 * NJAU 电竞社 · 主页交互 (M1)
 * 导航 / 揭示动画 / 数字滚动 / 游戏分部与报名表单渲染 / 开场过渡衔接
 * ========================================================================== */
(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var DATA = window.NJAUEC_DATA || { games: [], stats: [], events: [], honors: [] };
  var escapeHTML = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  };

  var GAME_ICONS = {
    valorant: "assets/game-icons/valorant.png",
    cs2: "assets/game-icons/cs2.svg",
    wangzhe: "assets/game-icons/wangzhe.ico",
    delta: "assets/game-icons/delta.png",
    naraka: "assets/game-icons/naraka.jpg",
    identityv: "assets/game-icons/identityv.jpg",
    overwatch: "assets/game-icons/overwatch.svg",
    lol: "assets/game-icons/lol.png"
  };

  /* ---------------- 渲染：游戏分部（顺序由 data.js 决定） ---------------- */
  function renderGames() {
    var grid = $("#gamesGrid");
    if (!grid) return;
    DATA.games.forEach(function (g, i) {
      var el = document.createElement("article");
      el.className = "card card-hover game-card reveal game-card--" + g.id;
      el.style.setProperty("--gc", g.theme);
      el.style.setProperty("--d", (i * 0.06).toFixed(2) + "s");
      var gameName = escapeHTML(g.name);
      var gameNameEn = escapeHTML(g.name_en);
      var gameDesc = escapeHTML(g.desc);
      var artStage = g.id === "wangzhe" && window.NJAUEC_WANGZHE_ART ?
        window.NJAUEC_WANGZHE_ART.renderStage(g.characters) : g.id === "delta" ?
        '<div class="game-art-stage game-art-stage--delta" aria-label="三角洲行动人物立绘">' +
          '<button class="game-character-slot game-character-slot--filled delta-character-slot" type="button" data-delta-gun data-gun="gun3" aria-label="三角洲像素角色，当前使用冲锋枪，点击切换武器" title="点击人物切换武器">' +
            '<img class="game-character-art delta-character-art" data-delta-sprite src="' + ((g.characters && g.characters[0]) || 'assets/delta/gun-switcher/gun3_0.png') + '?v=20260926" alt="" draggable="false" decoding="async">' +
          '</button>' +
          (g.characters && g.characters.length > 1 ?
            g.characters.slice(1).map(function (src, idx) {
              return '<div class="game-character-slot game-character-slot--filled" data-character-slot="' + (idx + 2) + '">' +
                '<img class="game-character-art delta-character-static" src="' + src + '" alt="" loading="lazy" decoding="async"></div>';
            }).join("") :
            [2, 3].map(function (slot) {
              return '<div class="game-character-slot" data-character-slot="' + slot + '">' +
                '<span class="character-slot-number">0' + slot + '</span>' +
                '<span>像素立绘位</span>' +
              '</div>';
            }).join("")) +
        '</div>' :
      g.characters && g.id === "lol" ?
        '<div class="game-art-stage game-art-stage--lol" aria-label="LOL英雄联盟人物立绘">' +
          '<button class="game-character-slot game-character-slot--filled lol-character-slot lol-kindred-slot" type="button" aria-label="灵魂莲华 千珏，点击切换表情" title="点击千珏切换表情" data-lol-kindred>' +
            '<img class="game-character-art lol-character-art lol-kindred-art" src="assets/lol/character-01-a.png" alt="千珏" data-default="assets/lol/character-01-a.png" data-alt="assets/lol/character-01-b.png" loading="lazy" decoding="async">' +
          '</button>' +
          (g.characters && g.characters.length > 1 ?
            g.characters.slice(1).map(function (src) {
              return '<div class="game-character-slot game-character-slot--filled">' +
                '<img class="game-character-art lol-character-art" src="' + src + '" alt="" loading="lazy" decoding="async"></div>';
            }).join("") : "") +
        '</div>' :
      g.characters && g.id !== "valorant" ?
        '<div class="game-art-stage" aria-label="' + gameName + '人物立绘">' +
          g.characters.map(function (src) {
            return '<div class="game-character-slot game-character-slot--filled">' +
              '<img class="game-character-art" src="' + src + '" alt="" loading="lazy" decoding="async"></div>';
          }).join("") +
        '</div>' :
      g.characters ?
        '<div class="game-art-stage game-art-stage--valorant" aria-label="瓦罗兰特角色互动区">' +
          g.characters.map(function (src, index) {
            if (index < 2 && window.NJAUEC_VALORANT_ART) return window.NJAUEC_VALORANT_ART.render(src, index);
            if (index < 2) return '<div class="valorant-character" role="img" aria-label="瓦罗兰特像素角色立绘">' +
              '<img class="valorant-character-art" src="' + src + '" alt="" loading="lazy" decoding="async"></div>';
            return '<button class="valorant-character valorant-character--cat" type="button" aria-label="点击猫猫幽影，听猫叫" data-valorant-cat>' +
              '<img class="valorant-character-art" src="' + src + '" alt="" loading="lazy" decoding="async">' +
              '<span class="valorant-cat-bubble" aria-live="polite" aria-atomic="true"></span>' +
              '<span class="valorant-cat-anger" aria-hidden="true">💢</span></button>';
          }).join("") +
        '</div>' :
        '<div class="game-art-stage" aria-label="' + gameName + '人物立绘展示区">' +
          [1, 2, 3].map(function (slot) {
            return '<div class="game-character-slot" data-character-slot="' + slot + '">' +
              '<span class="character-slot-number">0' + slot + '</span>' +
              '<span>像素立绘位</span>' +
            '</div>';
          }).join("") +
        '</div>';
      el.innerHTML =
        artStage +
        '<div class="game-content">' +
          '<div class="game-info">' +
            '<div class="game-top">' +
              '<span class="game-sprite game-sprite--' + g.id + '"><img class="game-icon" src="' + GAME_ICONS[g.id] + '" alt="" aria-hidden="true" loading="lazy" decoding="async"></span>' +
              (g.id === "valorant" ? "" : '<span class="game-idx">0' + (i + 1) + "</span>") +
            "</div>" +
            "<h3>" + gameName + "</h3>" +
            '<p class="game-en">' + gameNameEn + "</p>" +
            '<p class="game-desc">' + gameDesc + "</p>" +
            '<div class="game-foot">' +
              '<span class="chip"><span class="dot"></span>' + g.id + "</span>" +
            "</div>" +
          '</div>' +
          '<div class="division-entry">' +
            '<button class="btn btn-primary division-join" type="button" aria-haspopup="dialog" aria-label="' + gameName + '分部加群方式" data-division="' + g.id + '">加入分部 <span aria-hidden="true">↗</span></button>' +
          '</div>' +
        "</div>";
      grid.appendChild(el);
    });
  }

  function initValorantCharacters() {
    var grid = $('#gamesGrid');
    if (!grid) return;
    if (window.NJAUEC_VALORANT_ART) window.NJAUEC_VALORANT_ART.init(grid);
    var meow = new Audio('assets/valorant/meow-cute.ogg');
    meow.preload = 'auto';
    meow.volume = 0.52;
    var clickCount = 0;
    var bubbleTimer;
    var angerTimer;
    var phrases = ['喵？', '今天也要赢哦！', '再摸摸我～', '我在蹲点呢。', '耳朵痒啦！'];
    grid.addEventListener('click', function (event) {
      var cat = event.target.closest('[data-valorant-cat]');
      if (!cat) return;
      var bubble = cat.querySelector('.valorant-cat-bubble');
      meow.pause();
      meow.currentTime = 0;
      meow.play().catch(function () {});
      cat.classList.remove('is-meowing');
      void cat.offsetWidth;
      cat.classList.add('is-meowing');
      setTimeout(function () { cat.classList.remove('is-meowing'); }, 480);
      if (cat.classList.contains('is-angry')) return;
      clickCount += 1;
      clearTimeout(bubbleTimer);
      if (clickCount > 5) {
        clickCount = 0;
        bubble.textContent = '不许再戳啦！';
        cat.classList.add('is-angry');
        cat.classList.add('has-bubble');
        clearTimeout(angerTimer);
        angerTimer = setTimeout(function () {
          cat.classList.remove('is-angry', 'has-bubble');
          bubble.textContent = '';
        }, 2000);
      } else {
        bubble.textContent = phrases[clickCount - 1];
        cat.classList.add('has-bubble');
        bubbleTimer = setTimeout(function () {
          cat.classList.remove('has-bubble');
          bubble.textContent = '';
        }, 1700);
      }
    });
  }

  function initDeltaGunSwitcher() {
    var buttons = $$('[data-delta-gun]');
    if (!buttons.length) return;

    var weapons = {
      gun3: { name: '冲锋枪', prefix: 'assets/delta/gun-switcher/gun3' },
      gun4: { name: '狙击步枪', prefix: 'assets/delta/gun-switcher/gun4' }
    };
    Object.keys(weapons).forEach(function (key) {
      for (var i = 0; i < 6; i += 1) {
        var preload = new Image();
        preload.src = weapons[key].prefix + '_' + i + '.png';
      }
    });
    var switchSound = new Audio('assets/delta/gun-switcher/gun-switch.wav');
    switchSound.preload = 'auto';
    switchSound.volume = 0.38;

    var states = buttons.map(function (button) {
      return { button: button, image: button.querySelector('[data-delta-sprite]'), weapon: 'gun3', frame: 0, visible: !('IntersectionObserver' in window), timer: null };
    });

    function sync(state) {
      var shouldPlay = state.visible && !document.hidden;
      if (shouldPlay && state.timer === null) {
        state.timer = window.setInterval(function () {
          state.frame = (state.frame + 1) % 6;
          state.image.src = weapons[state.weapon].prefix + '_' + state.frame + '.png';
        }, 100);
      } else if (!shouldPlay && state.timer !== null) {
        window.clearInterval(state.timer);
        state.timer = null;
      }
    }

    states.forEach(function (state) {
      state.button.addEventListener('click', function () {
        switchSound.pause();
        switchSound.currentTime = 0;
        switchSound.play().catch(function () {});
        state.weapon = state.weapon === 'gun3' ? 'gun4' : 'gun3';
        state.frame = 0;
        var weapon = weapons[state.weapon];
        state.button.dataset.gun = state.weapon;
        state.button.setAttribute('aria-label', '三角洲像素角色，当前使用' + weapon.name + '，点击切换武器');
        state.button.setAttribute('title', '当前：' + weapon.name + ' · 点击切换武器');
        state.image.src = weapon.prefix + '_0.png';
      });
    });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var state = states.filter(function (item) { return item.button === entry.target; })[0];
          if (!state) return;
          state.visible = entry.isIntersecting;
          sync(state);
        });
      }, { rootMargin: '80px' });
      states.forEach(function (state) { observer.observe(state.button); });
    }
    document.addEventListener('visibilitychange', function () {
      states.forEach(sync);
    });
  }

  /* ---------------- LOL 千珏点击换脸互动 ---------------- */
  function initLolCharacters() {
    var buttons = $$('[data-lol-kindred]');
    if (!buttons.length) return;

    var preload = new Image();
    preload.src = 'assets/lol/character-01-b.png';

    buttons.forEach(function (btn) {
      var img = btn.querySelector('.lol-kindred-art');
      if (!img) return;
      var srcA = img.getAttribute('data-default') || 'assets/lol/character-01-a.png';
      var srcB = img.getAttribute('data-alt') || 'assets/lol/character-01-b.png';
      var isAlt = false;

      btn.addEventListener('click', function () {
        isAlt = !isAlt;
        img.src = isAlt ? srcB : srcA;
        btn.classList.add('lol-kindred--clicked');
        btn.setAttribute('title', isAlt ? '当前：红印战颜 · 点击切换' : '当前：灵动笑靥 · 点击切换');
        btn.setAttribute('aria-label', isAlt ? '千珏（红印战颜），点击切回' : '千珏（灵动笑靥），点击切换表情');
        window.setTimeout(function () {
          btn.classList.remove('lol-kindred--clicked');
        }, 220);
      });
    });
  }

  function initDivisionGroups() {
    var dialog = $('#division-dialog');
    var returnFocus = null;
    if (!dialog) return;
    var number = '';
    $('#gamesGrid').addEventListener('click', function (event) {
      var button = event.target.closest('[data-division]');
      if (!button) return;
      var game = DATA.games.find(function (item) { return item.id === button.dataset.division; });
      if (!game) return;
      var ownGroup = (DATA.divisionGroups || {})[game.id];
      var group = ownGroup && (ownGroup.url || ownGroup.qr || ownGroup.number) ? ownGroup : DATA.mainGroup;
      var isMain = group === DATA.mainGroup;
      number = group.number || '';
      returnFocus = button;
      $('#division-dialog-title').textContent = game.name + ' · 加入分部';
      $('#division-dialog-note').textContent = isMain
        ? '分部群信息整理中，先加入社团大群，联系负责人进入' + game.name + '分部。'
        : '点击下方按钮打开 QQ，或扫码加入。手机上也可保存二维码，再从 QQ 相册识别。';
      $('#division-group-name').textContent = isMain ? '社团大群 · ' + group.name : group.name || game.name + '分部群';
      var image = $('#division-group-qr');
      image.hidden = !group.qr;
      if (group.qr) { image.src = group.qr; image.alt = (isMain ? '社团大群' : game.name + '分部群') + '二维码'; }
      else image.removeAttribute('src');
      var link = $('#division-qq-link');
      link.hidden = !group.url;
      if (group.url) link.href = group.url;
      else link.removeAttribute('href');
      link.textContent = isMain ? 'QQ 加入社团大群 ↗' : 'QQ 加入分部群 ↗';
      var save = $('#division-save-qr');
      save.hidden = !group.qr;
      if (group.qr) { save.href = group.qr; save.download = game.name + '分部群二维码.png'; }
      else save.removeAttribute('href');
      $('#division-group-number').textContent = number ? '群号 ' + number : '';
      $('#division-copy-number').hidden = !number;
      dialog.showModal();
    });
    dialog.querySelector('.division-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener('close', function () { if (returnFocus) returnFocus.focus({ preventScroll: true }); });
    $('#division-copy-number').addEventListener('click', function () {
      if (!number) return;
      if (!navigator.clipboard) { toast('群号：' + number); return; }
      navigator.clipboard.writeText(number).then(function () { toast('群号已复制'); }, function () { toast('群号：' + number); });
    });
  }

  /* ---------------- 渲染：报名表单的游戏多选 chip ---------------- */
  function renderApplyChips() {
    var box = $("#applyGames");
    if (!box) return;
    DATA.games.forEach(function (g) {
      var label = document.createElement("label");
      label.className = "chip-check";
      label.style.setProperty("--gc", /^#[\da-f]{6}$/i.test(g.theme || "") ? g.theme : "#16c6b3");
      label.innerHTML =
        '<input type="checkbox" name="games" value="' + escapeHTML(g.id) + '">' +
        "<span>" + escapeHTML(g.name) + "</span>";
      box.appendChild(label);
    });
  }

  /* ---------------- 开场 overlay 与主页的衔接 ---------------- */
  function initIntro() {
    var intro = $("#intro");
    var enterBtn = $("#enterBtn");
    var hint = $("#introHint");
    var fallbackImg = $("#introFallback");
    var Hero = window.NJAUEC_Hero;
    var returnToActivities = new URLSearchParams(window.location.search).get('from') === 'activities';

    function finishEnter() {
      document.documentElement.classList.remove("no-scroll");
      intro.classList.add("is-hidden");
      if (returnToActivities) {
        var events = $('#events');
        if (events) events.scrollIntoView({ behavior: 'instant', block: 'start' });
        returnToActivities = false;
        var returnUrl = new URL(window.location.href);
        returnUrl.searchParams.delete('from');
        window.history.replaceState(null, '', returnUrl.pathname + returnUrl.search + '#events');
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }

    function showFallback() {
      if (fallbackImg) fallbackImg.hidden = false;
      if (hint) hint.textContent = "当前环境不支持 WebGL 粒子，已切换静态 logo";
      intro.classList.add("is-formed");
    }

    if (Hero && Hero.enabled) {
      Hero.start();
    } else {
      showFallback();
    }

    window.addEventListener("hero:fallback", showFallback);
    window.addEventListener("hero:formed", function () {
      intro.classList.add("is-formed");
      if (hint) hint.textContent = "移动鼠标感受视差 · 粒子已聚合完成";
    });
    window.addEventListener("hero:entered", finishEnter);
    if (returnToActivities) {
      if (Hero && Hero.enabled && Hero.skip) Hero.skip();
      else finishEnter();
    }
    $("#skipBtn").addEventListener("click", function () {
      if (Hero && Hero.enabled && Hero.skip) Hero.skip();
      else finishEnter();
    });

    enterBtn.addEventListener("click", function () {
      if (Hero && Hero.enabled) {
        Hero.enter();
      } else {
        finishEnter();
      }
    });

    var replayBtn = $("#replayBtn");
    if (replayBtn) {
      replayBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "auto" });
        document.documentElement.classList.add("no-scroll");
        intro.classList.remove("is-hidden");
        intro.classList.remove("is-formed");
        if (hint) hint.textContent = "粒子汇聚中… 移动鼠标感受视差";
        if (Hero && Hero.enabled) Hero.replay();
      });
    }
  }

  /* ---------------- 导航 ---------------- */
  function initNav() {
    var burger = $("#navBurger");
    var links = $("#navLinks");
    if (burger && links) {
      burger.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", String(links.classList.toggle("open")));
      });
      links.addEventListener("click", function (ev) {
        if (ev.target.tagName === "A") {
          links.classList.remove("open");
          burger.setAttribute("aria-expanded", "false");
        }
      });
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && links.classList.contains("open")) {
          links.classList.remove("open");
          burger.setAttribute("aria-expanded", "false");
          burger.focus();
        }
      });
    }
    var anchors = $$("#navLinks a");
    var sections = $$("main section[id]");
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        anchors.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------------- 揭示动画 ---------------- */
  function initReveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- 数据动画：数字滚动 ---------------- */
  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length) return;
    function run(el) {
      var end = parseFloat(el.getAttribute("data-count")) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var t0 = performance.now();
      var dur = 1200;
      function step(now) {
        var p = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * e) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          run(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- 顶部滚动进度条 ---------------- */
  function initProgress() {
    var bar = $("#scrollProgress");
    if (!bar) return;
    var ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  /* ---------------- Toast ---------------- */
  var toastTimer = 0;
  function toast(msg) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  /* ---------------- 招新表单（M3：接 Cloudflare Worker 后端） ----------------
   * 契约见 site/docs/API.md §4：POST /api/apply
   * 本地联调：前端 4173 → Worker 8787；线上同域部署后走同源 /api/*。      */
  var API_BASE = (location.hostname === "127.0.0.1" || location.hostname === "localhost") && location.port === "4173"
    ? "http://127.0.0.1:8787"
    : "";
  function initForm() {
    var form = $("#applyForm");
    if (!form) return;
    var submitting = false;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (submitting) return;
      var ok = true;
      function fail(input, msgEl, msg) {
        ok = false;
        if (input) input.classList.add("invalid");
        if (msgEl) msgEl.textContent = msg;
      }
      var name = form.elements["name"];
      var contact = form.elements["contact"];
      var checked = $$('#applyGames input:checked');
      form.querySelectorAll(".invalid").forEach(function (el) { el.classList.remove("invalid"); });
      form.querySelectorAll(".field-error").forEach(function (el) { el.textContent = ""; });

      if (!name.value.trim()) fail(name, $("#errName"), "请填写姓名");
      if (!contact.value.trim()) fail(contact, $("#errContact"), "请填写微信 / QQ 联系方式");
      if (!checked.length) fail(null, $("#errGames"), "请至少选择一个意向分部");

      if (!ok) {
        toast("表单还有必填项没填好哦");
        var firstInvalid = form.querySelector(".invalid") || form.querySelector('#applyGames input');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var payload = {
        name: name.value.trim(),
        contact: contact.value.trim(),
        games: checked.map(function (el) { return el.value; }),
      };
      var majorEl = form.elements["major"];
      var introEl = form.elements["intro"];
      if (majorEl && majorEl.value.trim()) payload.major = majorEl.value.trim();
      if (introEl && introEl.value.trim()) payload.intro = introEl.value.trim();

      var submitBtn = form.querySelector('button[type="submit"]');
      submitting = true;
      if (submitBtn) submitBtn.disabled = true;
      var controller = new AbortController();
      var requestTimer = setTimeout(function () { controller.abort(); }, 15000);
      form.setAttribute('aria-busy', 'true');
      fetch(API_BASE + "/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
        .then(function (res) { return res.json().then(function (body) { return { status: res.status, body: body }; }); })
        .then(function (r) {
          if (r.status === 200 && r.body.ok) {
            toast("报名已登记，请加入招新群确认入社");
            form.reset();
            return;
          }
          var errs = (r.body && r.body.errors) || {};
          if (errs.name) fail(name, $("#errName"), errs.name);
          if (errs.contact) fail(contact, $("#errContact"), errs.contact);
          if (errs.games) fail(null, $("#errGames"), errs.games);
          toast(errs.body || errs.games || errs.name || errs.contact || errs.major || errs.intro || "提交失败，请稍后再试");
        })
        .catch(function (error) {
          toast(error.name === 'AbortError' ? "请求超时，未能确认是否登记，请在招新群联系负责人" : "网络异常，未能确认是否登记，请稍后重试或联系负责人");
        })
        .finally(function () {
          clearTimeout(requestTimer);
          submitting = false;
          form.removeAttribute('aria-busy');
          if (submitBtn) submitBtn.disabled = false;
        });
    });
    form.addEventListener("input", function (ev) {
      ev.target.classList.remove("invalid");
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    renderGames();
    initValorantCharacters();
    initDeltaGunSwitcher();
    if (window.NJAUEC_WANGZHE_ART) window.NJAUEC_WANGZHE_ART.init(document);
    if (window.NJAUEC_CS2_ART) window.NJAUEC_CS2_ART.init(document);
    initLolCharacters();
    if (window.NJAUEC_DIVISION_FX) window.NJAUEC_DIVISION_FX.init(document);
    initDivisionGroups();
    renderApplyChips();
    DATA.stats.forEach(function (stat, index) {
      var number = $$('.stat-num[data-count]')[index];
      if (!number) return;
      number.setAttribute('data-count', String(Number(stat.value) || 0));
      number.setAttribute('data-suffix', typeof stat.suffix === 'string' ? stat.suffix : '');
      var label = number.parentNode.querySelector('.stat-label');
      if (label && typeof stat.label === 'string') label.textContent = stat.label;
    });
    initIntro();
    initNav();
    initReveal();
    initCounters();
    initProgress();
    initForm();
    var year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function start() {
    Promise.resolve(window.NJAUEC_DATA_READY).then(boot, boot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();


// Honor image preview modal
(function setupHonorDialog() {
  function init() {
    var dialog = document.getElementById('honor-dialog');
    if (!dialog) return;
    var closeBtn = document.getElementById('honor-dialog-close');
    var imgEl = document.getElementById('honor-dialog-img');
    var titleEl = document.getElementById('honor-dialog-title');
    var subEl = document.getElementById('honor-dialog-sub');
    var descEl = document.getElementById('honor-dialog-desc');

    function close() {
      if (dialog.open) dialog.close();
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) close();
    });

    document.querySelectorAll('.honor-card').forEach(function (card) {
      var media = card.querySelector('.honor-media');
      if (!media) return;
      function openPreview() {
        var img = media.querySelector('img');
        var h3 = card.querySelector('h3');
        var chip = card.querySelector('.chip');
        var detail = card.getAttribute('data-detail') || (card.querySelector('p') ? card.querySelector('p').textContent : '');
        if (!img) return;

        imgEl.src = img.src;
        imgEl.alt = img.alt || '';
        titleEl.textContent = h3 ? h3.textContent : '赛事荣誉大图';
        if (subEl) subEl.textContent = chip ? ('所属项目：' + chip.textContent) : '';
        if (descEl) descEl.textContent = detail;
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      }

      media.addEventListener('click', openPreview);
      media.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPreview();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();