/* Wangzhe sprite stage: original-coordinate masks, local expression plates,
 * and finite, cancellable WAAPI timelines. Original character PNGs are intact. */
(function () {
  'use strict';
  var ROOT = 'assets/wangzhe/interaction-v1/';
  var FILES = ['left-smile.png', 'gongsunli-smile.png', 'mage-clean-plate.png', 'gongsunli-clean-plate.png', 'left-hat-clean-plate.png', 'gongsunli-base.png?v=20260926-v9'];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var audio;

  function image(src, w, h) {
    return '<image href="' + src + '" width="' + w + '" height="' + h + '" preserveAspectRatio="none"/>';
  }
  function clip(id, shape) { return '<clipPath id="' + id + '">' + shape + '</clipPath>'; }
  function path(d) { return '<path d="' + d + '"/>'; }
  function inverse(id, shape, w, h) {
    return '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + w + '" height="' + h + '" style="mask-type:luminance"><rect width="' + w + '" height="' + h + '" fill="white"/><g fill="black">' + shape + '</g></mask>';
  }
  function part(name, id, img) { return '<g data-part="' + name + '"><g clip-path="url(#' + id + ')">' + img + '</g></g>'; }
  function star(x, y, size, color, index) {
    return '<g transform="translate(' + x + ' ' + y + ')"><g class="wz-fx" data-fx="' + index + '" fill="' + color + '"><path transform="scale(' + size + ')" d="M2 0h1v2h2v1H3v2H2V3H0V2h2z"/></g></g>';
  }
  function petal(x, y, size, index) {
    return '<g transform="translate(' + x + ' ' + y + ')"><g class="wz-fx" data-fx="' + index + '"><path fill="#ff9eb8" transform="scale(' + size + ')" d="M1 0h3v1h1v3H4v1H2v1H0V2h1z"/><path fill="#ffe3e9" transform="scale(' + size + ')" d="M1 1h2v1H2v2H1z"/></g></g>';
  }
  function left(src) {
    var w = 1071, h = 1448, img = image(src, w, h);
    var mascot = path('M665 0H704L720 27L744 39L770 64L797 99L806 135H858V174L839 197L814 213L792 224L779 236L766 247L754 258L740 274H646V264H636V258H628V250H621V242H613V235H605V229H598V223H588V198H581V192H576V186H572V179H563V173H556V167H548V162H536V157H521V148H526V141H534V134H542V117H550V109L573 95L593 84L615 59L646 38L656 18Z');
    var mascotHole = '<g stroke="black" stroke-width="16" stroke-linejoin="round">' + mascot + '</g>';
    var face = path('M465 527L557 485L591 487L619 512L631 545L624 603L590 624L490 620Z M443 650H521V699H443Z');
    var tassel = path('M716 1165H793V1448H692V1355H710Z M914 1142H973V1448H899V1360H916Z');
    return '<svg class="wz-sprite wz-layered" viewBox="0 0 1071 1448" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs>' +
      clip('wz-left-mascot', mascot) + clip('wz-left-face', face) + clip('wz-left-tassel', tassel) +
      '<mask id="wz-left-hat-fill" maskUnits="userSpaceOnUse" x="0" y="0" width="1071" height="1448" style="mask-type:luminance"><g fill="white" stroke="white" stroke-width="16" stroke-linejoin="round">' + mascot + '</g></mask>' + inverse('wz-left-body', mascotHole + tassel, w, h) + '</defs>' +
      '<g mask="url(#wz-left-hat-fill)">' + image(ROOT + FILES[4], w, h) + '</g>' +
      '<g mask="url(#wz-left-body)">' + img + '</g>' +
      part('tassel', 'wz-left-tassel', img) + part('mascot', 'wz-left-mascot', img) +
      '<g class="wz-expression" data-part="smile" clip-path="url(#wz-left-face)">' + image(ROOT + FILES[0], w, h) + '</g>' +
      star(841, 687, 11, '#ffe49c', 0) + star(1005, 952, 8, '#ffd15d', 1) + star(651, 1019, 6, '#fff3bd', 2) + '</svg>';
  }
  function mage(src) {
    var w = 1226, h = 1224, img = image(src, w, h);
    var green = path('M969 373H1013L1029 396H1050L1063 366L1094 358L1125 362L1130 398L1140 429L1160 446L1174 480L1180 507L1205 527L1226 530V578L1206 596L1183 594L1178 610L1153 633L1111 648L1067 637L1033 638L1007 656H970L955 639L963 611L978 594L957 566L949 549L948 512L963 479L966 437Z');
    var ghost = path('M932 877H1009L1036 895L1060 917L1076 947L1086 997L1111 1024L1136 1039L1148 1052V1090L1128 1108H1075L1069 1139L1044 1154H992L972 1134L970 1114L964 1114L952 1145L939 1165H890L873 1142L872 1115L851 1093L851 1077L857 1059L853 1029L855 979L859 945L874 920L899 903L918 886Z');
    var shapes = green + ghost;
    return '<svg class="wz-sprite wz-layered" viewBox="0 0 1226 1224" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs>' +
      clip('wz-green-cut', green) + clip('wz-ghost-cut', ghost) + clip('wz-mage-holes', shapes) +
      clip('wz-mage-backfill', path('M940 350H1135V534H940Z M850 864H1130V950H920L900 1030L860 1085H845Z')) + inverse('wz-mage-body', shapes, w, h) + '</defs>' +
      '<g clip-path="url(#wz-mage-holes)"><g clip-path="url(#wz-mage-backfill)">' + image(ROOT + FILES[2], w, h) + '</g></g>' +
      '<g mask="url(#wz-mage-body)">' + img + '</g>' +
      part('green', 'wz-green-cut', img) + part('ghost', 'wz-ghost-cut', img) +
      '<g class="wz-tv-heart" data-part="screen"><path fill="#173aad" d="M207 1007H261V987H296V998H325V1011H356V1024H390V1097H367V1138H220V1094H207Z"/>' +
        '<path fill="#ffb7ec" d="M231 1028h23v-12h23v12h22v-12h24v12h23v24h-12v12h-12v12h-12v12h-22v-12h-12v-12h-12v-12h-23z"/></g>' +
      '<g class="wz-star-flash" data-part="hat-star" fill="#fff8b6"><path d="M839 156h16v40h35v16h-35v42h-16v-42h-36v-16h36z"/></g>' +
      star(856, 128, 8, '#fff2a4', 0) + star(1134, 726, 7, '#98fff1', 1) + star(935, 804, 9, '#e3b5ff', 2) + star(1131, 1154, 6, '#94eee6', 3) + '</svg>';
  }
  function gongsunli(src) {
    // Coordinates use a proportional 1172 x 1342 design plane.
    // Use high-fidelity base plate for 1:1 SVG pixel mapping to preserve fine facial details.
    var w = 1172, h = 1342;
    var baseSrc = ROOT + FILES[5];
    var img = image(baseSrc, w, h);
    var earL = path('M135 0H240L285 50L330 95L375 145L400 190V240H135Z');
    var earR = path('M670 20H710L740 60L745 110L735 160V250H500V195L530 165L545 125L585 75L645 30Z');
    var earCutL = path('M135 0H240L285 50L330 95L375 145L375 185L340 212L274 210L210 208L170 202L135 202Z');
    var earCutR = path('M670 20H710L740 60L745 110L735 160V226L670 226L600 223L500 223V195L530 165L545 125L585 75L645 30Z');
    // Replace the entire eye area, including the original upper lashes.
    var face = path('M230 500H350L372 542L419 564L438 523L490 541L552 559V651L512 672L463 696H359L308 676L260 642L230 602Z');
    var canopy = path('M830 230L858 233L900 280L968 354L1038 428L1068 482L1096 528L1140 553L1172 577V1165H1054L996 1087L1014 1022L1000 960L968 907L903 863L823 818L743 788L675 767L596 747L503 713L504 687L618 644L680 603L718 550L758 526L790 480L788 436L792 395L802 365L812 295L824 275Z');
    var ribbon = path('M489 740L554 745L590 775L642 796L689 786L755 750L798 750L878 793L964 844L1045 888L1045 926L1006 928L921 891L824 838L768 811L713 822L657 848L590 863L547 842L489 804Z');
    var shaft = path('M19 776L52 759L88 764L147 733L200 715L241 717L246 745L216 760L186 755L126 781L86 795L29 798Z');
    var hand = path('M241 676L274 653L300 654L332 677L350 696L339 720L294 711L265 737L238 720Z');
    var all = canopy + shaft + hand;
    return '<svg class="wz-sprite wz-layered" viewBox="0 0 1172 1342" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs>' +
      clip('wz-gsl-ear-l', earL) + clip('wz-gsl-ear-r', earR) + clip('wz-gsl-face', face) + clip('wz-gsl-inpaint', canopy) + clip('wz-gsl-grip', shaft + hand) +
      '<mask id="wz-gsl-parasol" maskUnits="userSpaceOnUse" x="0" y="0" width="1172" height="1342" style="mask-type:luminance"><rect width="1172" height="1342" fill="black"/><g fill="white">' + canopy + '</g><g fill="black">' + ribbon + '</g></mask>' +
      '<mask id="wz-gsl-body" maskUnits="userSpaceOnUse" x="0" y="0" width="1172" height="1342" style="mask-type:luminance"><rect width="1172" height="1342" fill="white"/><g fill="black">' + all + earCutL + earCutR + '</g><g fill="white">' + ribbon + '</g></mask>' + '</defs>' +
      '<g clip-path="url(#wz-gsl-inpaint)">' + image(ROOT + FILES[3], w, h) + '</g>' +
      '<g data-part="parasol"><g mask="url(#wz-gsl-parasol)">' + img + '</g></g>' +
      '<g clip-path="url(#wz-gsl-grip)">' + img + '</g>' +
      part('ear-left', 'wz-gsl-ear-l', img) + part('ear-right', 'wz-gsl-ear-r', img) +
      '<g mask="url(#wz-gsl-body)">' + img + '</g>' +
      '<g class="wz-expression" data-part="smile" clip-path="url(#wz-gsl-face)">' + image(ROOT + FILES[1], w, h) + '</g>' +
      petal(911, 361, 8, 0) + petal(1119, 655, 7, 1) + petal(1047, 995, 6, 2) + petal(805, 689, 6, 3) + '</svg>';
  }
  var renderers = [left, mage, gongsunli];
  var names = ['点击角色，微笑与帽顶小伙伴打招呼', '点击魔女，召唤像素小伙伴', '点击公孙离，微笑转伞，花瓣飘落'];
  function renderStage(sources) {
    return '<div class="game-art-stage game-art-stage--wangzhe" aria-label="王者荣耀角色互动区">' + sources.map(function (src, i) {
      return '<button type="button" class="wz-character" data-wz-character="' + i + '" aria-label="' + names[i] + '"><img class="wz-fallback" src="' + src + '" alt="" draggable="false">' + renderers[i](src) + '</button>';
    }).join('') + '</div>';
  }

  function chime(index) {
    try {
      if (index === 2) {
        // Gongsunli: play sakura petal rustle SFX (has 120ms built-in delay)
        var sfx = new window.Audio(ROOT.replace('interaction-v1/', 'sfx/new-06-sakura-rustle.wav'));
        sfx.volume = 0.55;
        sfx.play().catch(function () {});
        return;
      }
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audio) audio = new Ctx();
      if (audio.state === 'suspended') audio.resume().catch(function () {});
      var notes = [[880, 1174], [784, 1046, 1318]][index];
      if (!notes) return;
      notes.forEach(function (hz, i) {
        var oscillator = audio.createOscillator(), gain = audio.createGain();
        var start = audio.currentTime + i * 0.055;
        oscillator.type = 'sine'; oscillator.frequency.value = hz;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.024, start + 0.007);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
        oscillator.connect(gain); gain.connect(audio.destination);
        oscillator.start(start); oscillator.stop(start + 0.16);
        oscillator.onended = function () { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch (err) { /* Sound is optional; visual interactions still work. */ }
  }

  function init(root) {
    var stage = root.querySelector('.game-art-stage--wangzhe');
    if (!stage || stage.dataset.initialized) return;
    stage.dataset.initialized = 'true';
    var actors = Array.prototype.map.call(stage.querySelectorAll('[data-wz-character]'), function (button, index) {
      return { button: button, index: index, visible: false, ready: false, busy: false, action: [], idle: [], timer: null, hover: [] };
    });
    function node(actor, name) { return actor.button.querySelector('[data-part="' + name + '"]'); }
    function animate(actor, target, keys, options, list) {
      if (!target) return null;
      var animation = target.animate(keys, options);
      (list || actor.action).push(animation);
      return animation;
    }
    function transform(actor, name, values, duration, delay, list) {
      return animate(actor, node(actor, name), values.map(function (t) { return { transform: t }; }), { duration: duration, delay: delay || 0, easing: 'ease-in-out' }, list);
    }
    function rotate(angle, x, y) { return 'translate(' + x + 'px,' + y + 'px) rotate(' + angle + 'deg) translate(' + (-x) + 'px,' + (-y) + 'px)'; }
    function flash(actor, name, duration, delay, list) {
      return animate(actor, node(actor, name), [{ opacity: 0, offset: 0, easing: 'steps(1,end)' }, { opacity: 1, offset: 0.12, easing: 'steps(1,end)' }, { opacity: 1, offset: 0.79, easing: 'steps(1,end)' }, { opacity: 0, offset: 1 }], { duration: duration, delay: delay || 0 }, list);
    }
    function cancel(list) { list.splice(0).forEach(function (animation) { animation.cancel(); }); }
    function sync(actor) {
      var playing = actor.ready && actor.visible && !document.hidden && !actor.busy && !reduced.matches;
      actor.idle.forEach(function (animation) { playing ? animation.play() : animation.pause(); });
    }
    function finish(actor) {
      clearTimeout(actor.timer);
      cancel(actor.action);
      actor.busy = false;
      actor.button.classList.remove('is-playing');
      sync(actor);
    }
    function idle(actor, name, values, duration, delay) {
      var animation = animate(actor, node(actor, name), values.map(function (t) { return { transform: t }; }), {
        duration: duration, iterations: Infinity, delay: delay || 0, easing: 'ease-in-out'
      }, actor.idle);
      animation.pause();
    }
    function prepare(actor) {
      if (actor.index === 0) {
        idle(actor, 'tassel', [rotate(0, 828, 1150), rotate(1.15, 828, 1150), rotate(0, 828, 1150), rotate(-0.8, 828, 1150), rotate(0, 828, 1150)], 4200);
        idle(actor, 'mascot', ['translateY(0)', 'translateY(0)', 'translateY(-9px)', 'translateY(0)', 'translateY(0)'], 6700, 900);
      } else if (actor.index === 1) {
        idle(actor, 'green', ['translate(0,0)', 'translate(5px,-12px)', 'translate(0,0)', 'translate(-4px,7px)', 'translate(0,0)'], 4600);
        idle(actor, 'ghost', ['translate(0,0)', 'translate(-5px,-13px)', 'translate(0,0)', 'translate(4px,8px)', 'translate(0,0)'], 3900, 650);
      } else {
        idle(actor, 'ear-left', [rotate(0, 274, 210), rotate(0, 274, 210), rotate(-2.4, 274, 210), rotate(0, 274, 210), rotate(0, 274, 210)], 7600, 1000);
        idle(actor, 'ear-right', [rotate(0, 645, 223), rotate(0, 645, 223), rotate(2.1, 645, 223), rotate(0, 645, 223), rotate(0, 645, 223)], 8000, 1550);
      }
      actor.ready = true;
      actor.button.classList.add('is-ready');
      sync(actor);
    }
    function fx(actor) {
      Array.prototype.forEach.call(actor.button.querySelectorAll('[data-fx]'), function (target, i) {
        var petalMode = actor.index === 2;
        var dx = petalMode ? (i % 2 ? 70 : -100) : (i % 2 ? 24 : -20);
        var dy = petalMode ? 120 : -42;
        animate(actor, target, [
          { opacity: 0, transform: 'translate(0,0) scale(.65)', offset: 0 },
          { opacity: 1, transform: 'translate(0,-12px) scale(1)', offset: .2 },
          { opacity: .85, transform: 'translate(' + dx * .5 + 'px,' + dy * .4 + 'px) rotate(' + (petalMode ? 15 : 0) + 'deg)', offset: .65 },
          { opacity: 0, transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (petalMode ? 45 : 0) + 'deg)', offset: 1 }
        ], { duration: petalMode ? 1000 : 660, delay: 200 + i * 95, easing: 'ease-out' });
      });
    }
    function perform(actor) {
      if (!actor.ready || actor.busy || document.hidden) return;
      cancel(actor.hover);
      actor.busy = true;
      actor.button.classList.add('is-playing');
      // Reset idle parts to registration before the one-shot timeline takes over.
      actor.idle.forEach(function (animation) { animation.pause(); animation.currentTime = 0; });
      chime(actor.index);
      if (reduced.matches) {
        flash(actor, actor.index === 1 ? 'screen' : 'smile', 600);
        actor.timer = setTimeout(function () { finish(actor); }, 650);
        return;
      }
      fx(actor);
      if (actor.index === 0) {
        flash(actor, 'smile', 1100, 90);
        transform(actor, 'mascot', ['translate(0,0)', 'translate(0,7px)', 'translate(-5px,-39px)', 'translate(0,0)', 'translate(0,-10px)', 'translate(0,0)'], 1050);
        transform(actor, 'tassel', [rotate(0,828,1150), rotate(-2.3,828,1150), rotate(1.8,828,1150), rotate(-.9,828,1150), rotate(0,828,1150)], 1200, 30);
      } else if (actor.index === 1) {
        flash(actor, 'hat-star', 800);
        flash(actor, 'screen', 1150, 150);
        transform(actor, 'green', ['translate(0,0)', 'translate(10px,-13px)', 'translate(31px,-33px)', 'translate(40px,-4px)', 'translate(17px,12px)', 'translate(0,0)'], 1500, 60);
        transform(actor, 'ghost', ['translate(0,0)', 'translate(0,7px)', 'translate(-23px,-38px)', 'translate(-14px,-25px)', 'translate(0,6px)', 'translate(0,0)'], 1400, 120);
      } else {
        flash(actor, 'smile', 1150, 100);
        transform(actor, 'parasol', [rotate(0,277,696), rotate(-.5,277,696), rotate(2.4,277,696), rotate(1.5,277,696), rotate(-.25,277,696), rotate(0,277,696)], 1500);
        transform(actor, 'ear-left', [rotate(0,274,210), rotate(3.2,274,210), rotate(-2.1,274,210), rotate(1.3,274,210), rotate(0,274,210)], 1050, 90);
        transform(actor, 'ear-right', [rotate(0,645,223), rotate(-3.0,645,223), rotate(2.0,645,223), rotate(-1.1,645,223), rotate(0,645,223)], 1050, 145);
      }
      actor.timer = setTimeout(function () { finish(actor); }, actor.index === 0 ? 1350 : 1650);
    }
    actors.forEach(function (actor) {
      actor.button.addEventListener('click', function () { perform(actor); });
      actor.button.addEventListener('pointerenter', function (event) {
        if (!actor.ready || actor.busy || reduced.matches || event.pointerType === 'touch') return;
        if (actor.index === 2) actor.button.classList.add('is-reacting');
        cancel(actor.hover);
        var rect = actor.button.getBoundingClientRect();
        var towardRight = event.clientX >= rect.left + rect.width / 2;
        if (actor.index === 0) {
          transform(actor, 'mascot', ['translateY(0)', 'translateY(-15px)', 'translateY(0)'], 600, 0, actor.hover);
          flash(actor, 'smile', 240, 100, actor.hover);
        } else if (actor.index === 1) {
          flash(actor, 'hat-star', 500, 0, actor.hover);
          transform(actor, 'green', ['translate(0,0)', 'translate(' + (towardRight ? 14 : -14) + 'px,-10px)', 'translate(0,0)'], 600, 0, actor.hover);
        } else {
          flash(actor, 'smile', 315, 0, actor.hover);
          var ear = towardRight ? 'ear-right' : 'ear-left';
          var pivotX = towardRight ? 645 : 274, pivotY = towardRight ? 223 : 210;
          transform(actor, ear, [rotate(0,pivotX,pivotY), rotate(towardRight ? 2.3 : -2.3,pivotX,pivotY), rotate(0,pivotX,pivotY)], 550, 0, actor.hover);
        }
      });
      actor.button.addEventListener('pointerleave', function () { cancel(actor.hover); actor.button.classList.remove('is-reacting'); });
    });
    var observer = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var actor = actors.find(function (item) { return item.button === entry.target; });
        actor.visible = entry.isIntersecting;
        if (!actor.visible) { cancel(actor.hover); finish(actor); }
        sync(actor);
      });
    }, { threshold: 0.08 }) : null;
    actors.forEach(function (actor) { if (observer) observer.observe(actor.button); else actor.visible = true; });
    document.addEventListener('visibilitychange', function () {
      actors.forEach(function (actor) { if (document.hidden) { cancel(actor.hover); finish(actor); } sync(actor); });
    });
    reduced.addEventListener('change', function () { actors.forEach(function (actor) { cancel(actor.hover); finish(actor); sync(actor); }); });
    // Each actor has independent loading: an unavailable optional plate leaves
    // its original static image visible without disabling the other two actors.
    var required = [[FILES[0], FILES[4]], [FILES[2]], [FILES[1], FILES[3], FILES[5]]];
    actors.forEach(function (actor) {
      Promise.all(required[actor.index].map(function (name) {
        var img = new Image(); img.src = ROOT + name; return img.decode();
      })).then(function () { prepare(actor); }).catch(function () { actor.button.disabled = true; });
    });
  }
  window.NJAUEC_WANGZHE_ART = { renderStage: renderStage, init: init };
})();
