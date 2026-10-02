/* ==========================================================================
 * CS2 分部交互：点击紫衣哥（左一）扔闪光弹
 *   1. 出手音（拉环+语音）+ 闪光弹沿抛物线飞向中间人物右上方（边飞边转）
 *   2. 到位爆开：小范围白色径向爆闪 + 卡片轻微泛白 + 爆音（含耳鸣尾音）
 *   3. 中间与右侧人物后仰闪避一下
 * 素材：assets/cs2/flashbang.png / flash-throw.ogg / flash-bang.ogg
 * ========================================================================== */
(function () {
  "use strict";

  var stage = null;   // .game-card--cs2 .game-art-stage
  var slots = [];
  var throwerImg = null;
  var victimImgs = [];
  var victimRestingSrcs = [];
  var IMG_ARMED = "assets/cs2/character-01.png";
  var IMG_EMPTY = "assets/cs2/character-01-empty.png?v=20260925-clean2";
  var IMG_FLASHED = [
    "assets/cs2/character-02-flashed.png?v=20260926-left-eye-v4",
    "assets/cs2/character-03-flashed.png?v=20260926-both-eyes"
  ];
  var busy = false;
  var COOLDOWN = 2000;

  var sndThrow = null;
  var sndBang = null;
  var sndVoice = null;

  function init(root) {
    var card = root.querySelector(".game-card--cs2");
    if (!card) return;
    stage = card.querySelector(".game-art-stage");
    if (!stage) return;
    slots = Array.prototype.slice.call(stage.querySelectorAll(".game-character-slot"));
    if (slots.length < 3) return;

    var thrower = slots[0];
    thrower.classList.add("cs2-thrower");
    thrower.setAttribute("role", "button");
    thrower.setAttribute("tabindex", "0");
    thrower.setAttribute("aria-label", "点击紫衣探员，扔出闪光弹");
    thrower.addEventListener("click", toss);
    thrower.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toss(); }
    });

    // Middle CS2 character plays the supplied voice line on direct activation.
    var voiceTrigger = slots[1];
    voiceTrigger.classList.add("cs2-voice-trigger");
    voiceTrigger.setAttribute("role", "button");
    voiceTrigger.setAttribute("tabindex", "0");
    voiceTrigger.setAttribute("aria-label", "点击中间人物，播放语音");
    voiceTrigger.setAttribute("title", "点击播放语音");
    voiceTrigger.addEventListener("click", playVoiceLine);
    voiceTrigger.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); playVoiceLine(); }
    });

    sndThrow = new Audio("assets/cs2/flash-throw.ogg");
    sndBang = new Audio("assets/cs2/flash-bang.ogg");
    sndThrow.preload = "auto";
    sndBang.preload = "auto";
    sndThrow.volume = 0.7;
    sndBang.volume = 0.75;

    sndVoice = new Audio("assets/cs2/catchphrase.mp3?v=20260926-voice-v2");
    sndVoice.preload = "auto";
    sndVoice.volume = 0.9;

    throwerImg = slots[0].querySelector(".game-character-art");
    victimImgs = [slots[1], slots[2]].map(function (slot) {
      return slot.querySelector(".game-character-art");
    });
    victimRestingSrcs = victimImgs.map(function (img) {
      return img ? img.getAttribute("src") : "";
    });
    var pre = new Image();   // 预载空手图，避免切换时闪烁
    pre.src = IMG_EMPTY;
    IMG_FLASHED.forEach(function (src) {
      var pose = new Image();
      pose.src = src;
    });
  }

  function play(snd) {
    if (!snd) return;
    snd.pause();
    snd.currentTime = 0;
    snd.play().catch(function () {});
  }

  function playVoiceLine() {
    if (!sndVoice || !sndVoice.paused) return;
    sndVoice.currentTime = 0;
    sndVoice.play().catch(function () {});
  }

  function stopVoiceLine() {
    if (!sndVoice) return;
    sndVoice.pause();
    sndVoice.currentTime = 0;
  }

  function rectOf(el) { return el.getBoundingClientRect(); }

  function toss() {
    if (busy) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    stopVoiceLine();
    busy = true;
    setTimeout(function () { busy = false; }, COOLDOWN);

    play(sndThrow);
    if (throwerImg) throwerImg.src = IMG_EMPTY;   // 雷脱手

    var stageRect = rectOf(stage);
    var r0 = rectOf(slots[0]);       // 紫衣哥
    var r1 = rectOf(slots[1]);       // 蒙面哥
    // 起点：紫衣哥右手（图内右上）
    var sx = r0.left - stageRect.left + r0.width * 0.78;
    var sy = r0.top - stageRect.top + r0.height * 0.10;
    // 爆点：蒙面哥头顶右上方
    var tx = r1.left - stageRect.left + r1.width * 0.92;
    var ty = r1.top - stageRect.top - r1.height * 0.18;

    var fly = document.createElement("img");
    fly.src = "assets/cs2/flashbang.png";
    fly.alt = "";
    fly.className = "cs2-flashbang-fly";
    fly.style.left = sx + "px";
    fly.style.top = sy + "px";
    stage.appendChild(fly);

    var DUR = 620;
    var ARC = Math.max(70, (tx - sx) * 0.28);   // 抛物线拱高
    var t0 = performance.now();

    function frame(now) {
      var t = Math.min(1, (now - t0) / DUR);
      var e = 1 - Math.pow(1 - t, 2);           // easeOutQuad
      var x = sx + (tx - sx) * e;
      var y = sy + (ty - sy) * e - ARC * Math.sin(Math.PI * t);
      fly.style.transform = "translate(-50%,-50%) rotate(" + (720 * t) + "deg) scale(" + (1 - 0.25 * t) + ")";
      fly.style.left = x + "px";
      fly.style.top = y + "px";
      if (t < 1) { requestAnimationFrame(frame); return; }
      stage.removeChild(fly);
      bang(tx, ty);
    }
    requestAnimationFrame(frame);
  }

  function bang(x, y) {
    play(sndBang);

    // 白色径向爆闪
    var burst = document.createElement("div");
    burst.className = "cs2-flash-burst";
    burst.style.left = x + "px";
    burst.style.top = y + "px";
    stage.appendChild(burst);

    // 整卡轻微泛白
    var card = stage.closest(".game-card--cs2");
    if (card) {
      card.classList.add("cs2-flashlit");
      setTimeout(function () { card.classList.remove("cs2-flashlit"); }, 420);
    }

    // 两位受害者用专门绘制的捂眼姿势短暂替换待机立绘
    [slots[1], slots[2]].forEach(function (s, i) {
      setTimeout(function () {
        var img = victimImgs[i];
        if (img) img.src = IMG_FLASHED[i];
        s.classList.add("cs2-flinch");
        setTimeout(function () { s.classList.remove("cs2-flinch"); }, 850);
      }, 60 + i * 70);
    });

    // 闪光状态留出可辨认的时间，再恢复原立绘
    setTimeout(function () {
      victimImgs.forEach(function (img, i) {
        if (img && victimRestingSrcs[i]) img.src = victimRestingSrcs[i];
      });
    }, 1450);

    setTimeout(function () {
      if (burst.parentNode) burst.parentNode.removeChild(burst);
    }, 650);

    // 爆完收光后，手上雷"刷新"回来
    setTimeout(function () {
      if (throwerImg) throwerImg.src = IMG_ARMED;
    }, 1100);
  }

  window.NJAUEC_CS2_ART = { init: init };
})();
