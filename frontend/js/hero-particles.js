/* ==========================================================================
 * NJAU E-Sports Club · Opening 3D Gaussian-Splat Particle Xuanniao (M1 Rework v2)
 * --------------------------------------------------------------------------
 * Visual: "Gaussian splatting" particle cloud --
 *  1. Every particle is a SOFT GAUSSIAN BLOB: fragment shader evaluates
 *     exp(-r^2 * k) alpha falloff (core gaussian + wide halo gaussian),
 *     additive blending lets semi-transparent splats pile up like sprayed mist.
 *  2. Nebula feel: a second, shader-animated dust system (tiny stars +
 *     big soft mist splats + a few giant colored nebula clouds) floats in a
 *     deep volume behind/around the bird; all motion done in vertex shader.
 *  3. Strong 3D: logo samples are embossed into a 3D relief (dome + wing lift
 *     + tail dip + noise thickness), perspective projection, DOF attenuation
 *     (off-focus splats get larger/softer/dimmer: near sharp, far hazy),
 *     mouse parallax + slow orbital drift of the whole group.
 *  4. High contrast: deep-space intro bg (CSS) + additive glowing splats.
 * Chain preserved: converge -> hero:formed -> "enter home" -> burst -> hero:entered,
 * replay, hero:fallback, window.NJAUEC_Hero {enabled,start,enter,replay}.
 * Point source: http(s) runtime sampling assets/logo-bird.jpg; file:// falls back
 * to js/logo-points.js (tools/make_logo_mask.py, same rules).
 * ========================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("intro-canvas");
  var api = { enabled: false, start: start, enter: enter, replay: replay };
  window.NJAUEC_Hero = api;

  if (!canvas || typeof window.THREE === "undefined") return;
  api.enabled = true;

  var MOBILE =
    (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
    (navigator.hardwareConcurrency || 8) <= 4;
  var MAX_POINTS = MOBILE ? 6500 : 15000;
  var DUST_STARS = MOBILE ? 120 : 300;
  var DUST_MIST = MOBILE ? 40 : 110;
  var DUST_GIANT = MOBILE ? 5 : 9;
  var DEPTH_NOISE = 13;
  var BASE_Y = 22;            // lift the bird so it clears the intro UI
  var WORLD_H = 218;

  var renderer, scene, camera, group, points, dust, geo, mat, dustGeo, dustMat;
  var pos, targetP, startP, exitP, delayA, durA, sizeA, alphaA, twinkleA, colorA;
  var wingA, phaseA, tailA;                 // flight rig per-particle params
  var count = 0;
  var clockT0 = 0, maxEnd = 1, exitStart = -1, formedAt = 0;
  var state = "idle";
  var mouse = { x: 0, y: 0 }, camPos = { x: 0, y: 0 };
  var rafId = 0, running = false, formedFired = false, hiddenAt = 0;
  var lastSrc = null;

  /* ---------------- Auto background identification + sampling ---------------- */
  function chromaOf(r, g, b) {
    var mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
    var mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
    return mx - mn;
  }
  function lumOf(r, g, b) {
    return (r * 2126 + g * 7152 + b * 722) / 10000;
  }

  function cornerModel(d, sw, sh) {
    var samples = [];
    var corners = [[0, 0], [sw - 12, 0], [0, sh - 12], [sw - 12, sh - 12]];
    for (var c = 0; c < 4; c++) {
      for (var y = corners[c][1]; y < corners[c][1] + 12; y++) {
        for (var x = corners[c][0]; x < corners[c][0] + 12; x++) {
          var o = (y * sw + x) * 4;
          samples.push([d[o], d[o + 1], d[o + 2]]);
        }
      }
    }
    var neutral = 0, sr = 0, sg = 0, sb = 0;
    for (var i = 0; i < samples.length; i++) {
      var s = samples[i];
      if (chromaOf(s[0], s[1], s[2]) <= 6) neutral++;
      sr += s[0]; sg += s[1]; sb += s[2];
    }
    var n = samples.length;
    if (neutral / n < 0.8) return { mode: "flat", bg: [sr / n, sg / n, sb / n] };
    return { mode: "checker", bg: [sr / n, sg / n, sb / n] };
  }

  function isForeground(px, model) {
    if (model.mode === "checker") return chromaOf(px[0], px[1], px[2]) > 3;
    var dr = px[0] - model.bg[0], dg = px[1] - model.bg[1], db = px[2] - model.bg[2];
    return Math.sqrt(dr * dr + dg * dg + db * db) > 50;
  }

  function bandOf(r, g, b) {
    if (g - b > 10) return 2;               // mint feather
    return lumOf(r, g, b) >= 240 ? 1 : 3;   // milky-white bright / outline dark
  }

  function decodeEmbedded() {
    var P = window.NJAUEC_LOGO_POINTS;
    if (!P || !P.data) return null;
    var bin = window.atob(P.data);
    var u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    var dv = new DataView(u8.buffer);
    var pts = new Array(P.count);
    for (var k = 0; k < P.count; k++) {
      var o = k * 5;
      pts[k] = { x: dv.getUint16(o, true), y: dv.getUint16(o + 2, true), c: dv.getUint8(o + 4) };
    }
    return { w: P.w, h: P.h, pts: pts };
  }

  function sampleFromImage() {
    if (location.protocol === "file:") return Promise.resolve(null);
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        try {
          var SW = 640;
          var SH = Math.round((img.height * SW) / img.width);
          var cv = document.createElement("canvas");
          cv.width = SW; cv.height = SH;
          var ctx = cv.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, SW, SH);
          var d = ctx.getImageData(0, 0, SW, SH).data;
          var model = cornerModel(d, SW, SH);
          var gw = SW >> 1, gh = SH >> 1;
          var grid = new Uint8Array(gw * gh);
          var x, y, o;
          for (y = 0; y < gh; y++) {
            for (x = 0; x < gw; x++) {
              o = ((y * 2) * SW + (x * 2)) * 4;
              if (isForeground([d[o], d[o + 1], d[o + 2]], model)) grid[y * gw + x] = 1;
            }
          }
          var pts = [];
          for (y = 1; y < gh - 1; y++) {
            for (x = 1; x < gw - 1; x++) {
              var i = y * gw + x;
              if (!grid[i]) continue;
              var nb = grid[i - 1] + grid[i + 1] + grid[i - gw] + grid[i + gw] +
                       grid[i - gw - 1] + grid[i - gw + 1] + grid[i + gw - 1] + grid[i + gw + 1];
              if (nb < 4) continue;
              o = ((y * 2) * SW + (x * 2)) * 4;
              pts.push({ x: x * 2, y: y * 2, c: bandOf(d[o], d[o + 1], d[o + 2]) });
            }
          }
          if (!pts.length) return resolve(null);
          pts = pts.filter(function (p) { return p.y < SH * 0.76; });
          if (!pts.length) return resolve(null);
          var x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
          pts.forEach(function (p) {
            if (p.x < x0) x0 = p.x;
            if (p.x > x1) x1 = p.x;
            if (p.y < y0) y0 = p.y;
            if (p.y > y1) y1 = p.y;
          });
          var step = Math.max(2, Math.ceil(Math.sqrt(pts.length / MAX_POINTS)));
          var sel = [];
          pts.forEach(function (p) {
            if ((p.x - x0) % step === 0 && (p.y - y0) % step === 0) {
              sel.push({ x: p.x - x0, y: p.y - y0, c: p.c });
            }
          });
          resolve({ w: x1 - x0 + 1, h: y1 - y0 + 1, pts: sel });
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = function () { resolve(null); };
      img.src = "assets/logo-bird.jpg";
    });
  }

  /* ---------------- Palette (deep-space high-contrast glow) ---------------- */
  var BAND_PAL = {
    1: [[242, 252, 255], [127, 233, 255], [34, 228, 255]],   // milky white / ice cyan
    2: [[138, 255, 220], [0, 229, 196], [124, 255, 217]],    // mint feather
    3: [[96, 186, 255], [64, 150, 255], [170, 222, 255]]     // outline -> blue glow
  };
  var SPARKLE = [[255, 209, 102], [255, 107, 158], [184, 166, 255]];
  var NEBULA_MIST = [[22, 112, 132], [30, 92, 152], [82, 62, 164], [16, 122, 108], [52, 130, 170]];
  var STAR_COLS = [[255, 255, 255], [210, 240, 255], [178, 255, 236]];

  /* ---------------- Logo particles: 3D relief buffers ---------------- */
  function build(srcPts) {
    var pts = srcPts.pts;
    if (pts.length > MAX_POINTS) {
      var stride = pts.length / MAX_POINTS;
      var sel = [];
      for (var s = 0; s < pts.length; s += stride) sel.push(pts[s | 0]);
      pts = sel;
    }
    count = pts.length;
    var scale = WORLD_H / srcPts.h;

    pos = new Float32Array(count * 3);
    targetP = new Float32Array(count * 3);
    startP = new Float32Array(count * 3);
    exitP = new Float32Array(count * 3);
    delayA = new Float32Array(count);
    durA = new Float32Array(count);
    sizeA = new Float32Array(count);
    alphaA = new Float32Array(count);
    twinkleA = new Float32Array(count);
    colorA = new Float32Array(count * 3);
    wingA = new Float32Array(count);
    phaseA = new Float32Array(count);
    tailA = new Float32Array(count);

    maxEnd = 0;
    for (var i = 0; i < count; i++) {
      var p = pts[i], i3 = i * 3;
      var nx = p.x / srcPts.w, ny = p.y / srcPts.h;
      var tx = (p.x - srcPts.w / 2) * scale;
      var ty = -(p.y - srcPts.h / 2) * scale;

      // 3D relief: elliptical dome over the silhouette + wing lift + tail dip + noise,
      // so the formed bird is a sculpted volume, not a flat plane.
      var ex = (nx - 0.5) * 1.15, ey = ny - 0.5;
      var er = Math.min(1, Math.sqrt(ex * ex + ey * ey) * 2);
      var dome = Math.cos(er * Math.PI * 0.5);                    // 1 center -> 0 edge
      var wf = Math.min(1, Math.max(0, (0.68 - nx) / 0.5));       // wing zone
      var isTail = ny > 0.62 ? 1 : 0;
      var tz = dome * 26 + wf * 10 - isTail * 8 +
               (Math.random() + Math.random() - 1) * DEPTH_NOISE;
      targetP[i3] = tx; targetP[i3 + 1] = ty; targetP[i3 + 2] = tz;

      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(2 * Math.random() - 1);
      var R = 340 + Math.random() * 240;
      startP[i3] = R * Math.sin(ph) * Math.cos(th);
      startP[i3 + 1] = R * Math.cos(ph) * 0.8;
      startP[i3 + 2] = R * Math.sin(ph) * Math.sin(th) * 0.5 + 90;
      pos[i3] = startP[i3]; pos[i3 + 1] = startP[i3 + 1]; pos[i3 + 2] = startP[i3 + 2];

      var len = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
      var burst = 300 + Math.random() * 300;
      exitP[i3] = tx + (tx / len) * burst;
      exitP[i3 + 1] = ty + (ty / len) * burst + 80;
      exitP[i3 + 2] = tz + (tz / len) * burst + 150;

      delayA[i] = Math.random() * 0.9;
      durA[i] = 1.5 + Math.random() * 0.9;
      if (delayA[i] + durA[i] > maxEnd) maxEnd = delayA[i] + durA[i];

      var sparkle = Math.random() < 0.045;
      sizeA[i] = sparkle ? 5.0 + Math.random() * 2.2 : 2.2 + Math.random() * 2.9;
      alphaA[i] = (0.32 + Math.random() * 0.24) * (sparkle ? 1.35 : 1);
      twinkleA[i] = Math.random() * Math.PI * 2;

      wingA[i] = wf;
      phaseA[i] = nx * 3.2;
      tailA[i] = isTail;

      var col;
      if (sparkle) {
        col = SPARKLE[(Math.random() * SPARKLE.length) | 0];
      } else {
        var pair = BAND_PAL[p.c] || BAND_PAL[1];
        col = pair[(Math.random() * pair.length) | 0];
      }
      var jit = 0.92 + Math.random() * 0.16;
      colorA[i3] = (col[0] / 255) * jit;
      colorA[i3 + 1] = (col[1] / 255) * jit;
      colorA[i3 + 2] = (col[2] / 255) * jit;
    }
  }

  /* ---------------- Nebula dust: stars + mist + giant clouds ---------------- */
  function buildDust() {
    var total = DUST_STARS + DUST_MIST + DUST_GIANT;
    var dPos = new Float32Array(total * 3);
    var dCol = new Float32Array(total * 3);
    var dSize = new Float32Array(total);
    var dAlpha = new Float32Array(total);
    var dSharp = new Float32Array(total);
    var dSeed = new Float32Array(total * 3);

    function put(i, x, y, z, col, size, alpha, sharp) {
      var i3 = i * 3;
      dPos[i3] = x; dPos[i3 + 1] = y; dPos[i3 + 2] = z;
      dCol[i3] = col[0] / 255; dCol[i3 + 1] = col[1] / 255; dCol[i3 + 2] = col[2] / 255;
      dSize[i] = size; dAlpha[i] = alpha; dSharp[i] = sharp;
      dSeed[i3] = Math.random(); dSeed[i3 + 1] = Math.random(); dSeed[i3 + 2] = Math.random();
    }

    var i = 0, k;
    // tiny sharp stars, scattered through the whole volume
    for (k = 0; k < DUST_STARS; k++, i++) {
      put(i,
        (Math.random() - 0.5) * 1100,
        (Math.random() - 0.5) * 640,
        -420 + Math.random() * 640,
        STAR_COLS[(Math.random() * STAR_COLS.length) | 0],
        1.0 + Math.random() * 1.8,
        0.25 + Math.random() * 0.5,
        7 + Math.random() * 8);
    }
    // mid soft mist splats
    for (k = 0; k < DUST_MIST; k++, i++) {
      put(i,
        (Math.random() - 0.5) * 900,
        (Math.random() - 0.5) * 520,
        -380 + Math.random() * 520,
        NEBULA_MIST[(Math.random() * NEBULA_MIST.length) | 0],
        26 + Math.random() * 60,
        0.05 + Math.random() * 0.08,
        2.2 + Math.random() * 1.4);
    }
    // a few giant nebula clouds far behind the logo
    for (k = 0; k < DUST_GIANT; k++, i++) {
      put(i,
        (Math.random() - 0.5) * 760,
        (Math.random() - 0.5) * 420,
        -430 + Math.random() * 200,
        NEBULA_MIST[(Math.random() * NEBULA_MIST.length) | 0],
        150 + Math.random() * 130,
        0.045 + Math.random() * 0.05,
        1.9 + Math.random() * 0.5);
    }
    return { pos: dPos, col: dCol, size: dSize, alpha: dAlpha, sharp: dSharp, seed: dSeed, count: total };
  }

  /* ---------------- Gaussian splat shaders ---------------- */
  var FRAG =
    "varying vec3 vColor;\nvarying float vAlpha;\nvarying float vSharp;\n" +
    "void main() {\n" +
    "  vec2 uv = gl_PointCoord - 0.5;\n" +
    "  float r2 = dot(uv, uv) * 4.0;\n" +                 // 0 center -> 1 at edge
    "  if (r2 > 1.0) discard;\n" +
    "  float core = exp(-r2 * vSharp);\n" +               // gaussian core
    "  float halo = exp(-r2 * vSharp * 0.16);\n" +        // wide gaussian halo
    "  float a = (core * 0.95 + halo * 0.38) * vAlpha;\n" +
    "  if (a < 0.004) discard;\n" +
    "  vec3 col = vColor * (0.72 + 0.85 * core);\n" +
    "  gl_FragColor = vec4(col, a);\n" +
    "}";

  var VERT_LOGO =
    "attribute float aSize;\nattribute float aAlpha;\nattribute float aTwinkle;\nattribute vec3 aColor;\n" +
    "uniform float uTime;\nuniform float uFade;\nuniform float uPixelScale;\nuniform float uFocus;\n" +
    "varying vec3 vColor;\nvarying float vAlpha;\nvarying float vSharp;\n" +
    "void main() {\n" +
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0);\n" +
    "  float depth = max(1.0, -mv.z);\n" +
    "  float dof = clamp(abs(depth - uFocus) / 260.0, 0.0, 1.0);\n" +
    "  float tw = 0.80 + 0.20 * sin(uTime * 1.7 + aTwinkle);\n" +
    "  float farFade = 1.0 - smoothstep(520.0, 780.0, depth);\n" +
    "  float sizePx = aSize * (1.0 + dof * 1.7) * uPixelScale / depth;\n" +
    "  gl_PointSize = min(sizePx, 200.0);\n" +
    "  vAlpha = aAlpha * (0.28 + 0.72 * farFade) * uFade * tw / (1.0 + dof * 1.2);\n" +
    "  vSharp = mix(14.0, 4.5, dof);\n" +
    "  vColor = aColor;\n" +
    "  gl_Position = projectionMatrix * mv;\n" +
    "}";

  var VERT_DUST =
    "attribute float aSize;\nattribute float aAlpha;\nattribute float aSharp;\n" +
    "attribute vec3 aColor;\nattribute vec3 aSeed;\n" +
    "uniform float uTime;\nuniform float uFade;\nuniform float uPixelScale;\n" +
    "varying vec3 vColor;\nvarying float vAlpha;\nvarying float vSharp;\n" +
    "void main() {\n" +
    "  vec3 p = position;\n" +
    "  p.x += sin(uTime * (0.05 + aSeed.x * 0.10) + aSeed.y * 6.2831) * 16.0;\n" +
    "  p.y += cos(uTime * (0.04 + aSeed.y * 0.09) + aSeed.z * 6.2831) * 12.0;\n" +
    "  p.z += sin(uTime * (0.05 + aSeed.z * 0.08) + aSeed.x * 6.2831) * 14.0;\n" +
    "  vec4 mv = modelViewMatrix * vec4(p, 1.0);\n" +
    "  float depth = max(1.0, -mv.z);\n" +
    "  float tw = 0.72 + 0.28 * sin(uTime * (0.6 + aSeed.x) + aSeed.y * 40.0);\n" +
    "  gl_PointSize = min(aSize * uPixelScale / depth, 460.0);\n" +
    "  vAlpha = aAlpha * uFade * tw;\n" +
    "  vSharp = aSharp;\n" +
    "  vColor = aColor;\n" +
    "  gl_Position = projectionMatrix * mv;\n" +
    "}";

  /* ---------------- Three.js scene ---------------- */
  function initThree() {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 1, 2000);
    camera.position.set(0, 0, 430);
    group = new THREE.Group();
    group.position.y = BASE_Y;
    scene.add(group);

    geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colorA, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizeA, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphaA, 1));
    geo.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkleA, 1));

    mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 1 },
        uPixelScale: { value: 800 },
        uFocus: { value: 430 }
      },
      vertexShader: VERT_LOGO,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    points = new THREE.Points(geo, mat);
    group.add(points);

    var D = buildDust();
    dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(D.pos, 3));
    dustGeo.setAttribute("aColor", new THREE.BufferAttribute(D.col, 3));
    dustGeo.setAttribute("aSize", new THREE.BufferAttribute(D.size, 1));
    dustGeo.setAttribute("aAlpha", new THREE.BufferAttribute(D.alpha, 1));
    dustGeo.setAttribute("aSharp", new THREE.BufferAttribute(D.sharp, 1));
    dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(D.seed, 3));
    dustMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 1 },
        uPixelScale: { value: 800 }
      },
      vertexShader: VERT_DUST,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);   // dust stays in world space; logo group orbits inside it
    resize();
  }

  /* ---------------- Main loop ---------------- */
  function tick() {
    rafId = requestAnimationFrame(tick);
    var t = (performance.now() - clockT0) / 1000;
    mat.uniforms.uTime.value = t;
    dustMat.uniforms.uTime.value = t;
    var i, i3, p, e;

    if (state === "converge") {
      var done = true;
      for (i = 0; i < count; i++) {
        p = (t - delayA[i]) / durA[i];
        if (p <= 0) { p = 0; done = false; }
        else if (p >= 1) { p = 1; }
        else { done = false; }
        e = 1 - Math.pow(1 - p, 3);
        i3 = i * 3;
        var sway = (1 - e) * 26;
        pos[i3] = startP[i3] + (targetP[i3] - startP[i3]) * e +
                  Math.sin(t * 1.7 + twinkleA[i]) * sway;
        pos[i3 + 1] = startP[i3 + 1] + (targetP[i3 + 1] - startP[i3 + 1]) * e +
                  Math.cos(t * 1.3 + twinkleA[i]) * sway;
        pos[i3 + 2] = startP[i3 + 2] + (targetP[i3 + 2] - startP[i3 + 2]) * e;
      }
      geo.attributes.position.needsUpdate = true;
      group.rotation.y = Math.sin(t * 0.4) * 0.25 * (1 - Math.min(1, t / maxEnd));
      if (done || t > maxEnd + 0.2) {
        state = "formed";
        formedAt = t;
        if (!formedFired) {
          formedFired = true;
          window.dispatchEvent(new CustomEvent("hero:formed"));
        }
      }
    } else if (state === "formed") {
      // wing flap / tail swing / z breathing, then slow 3D orbit + drift of the group
      var ramp = Math.min(1, (t - formedAt) / 1.2);
      var flap = t * 5.0;
      for (i = 0; i < count; i++) {
        i3 = i * 3;
        var wf = wingA[i];
        var yo, zo;
        if (tailA[i] > 0.5) {
          yo = Math.sin(t * 2.2 + phaseA[i] * 0.7) * 7 * wf;
          zo = Math.cos(t * 2.0 + phaseA[i] * 0.7) * 3 * wf;
        } else {
          yo = Math.sin(flap + phaseA[i]) * 15 * wf;
          zo = Math.cos(flap * 0.92 + phaseA[i]) * 6 * wf;
        }
        pos[i3] = targetP[i3];
        pos[i3 + 1] = targetP[i3 + 1] + yo * ramp;
        pos[i3 + 2] = targetP[i3 + 2] + zo * ramp +
                      Math.sin(t * 0.9 + twinkleA[i]) * 2.0;
      }
      geo.attributes.position.needsUpdate = true;
      // slow orbital drift: the bird clearly turns in 3D, selling the volume
      group.rotation.y = (Math.sin(t * 0.17) * 0.38 + mouse.x * 0.22) * ramp;
      group.rotation.x = (Math.sin(t * 0.23) * 0.10 - mouse.y * 0.12) * ramp;
      group.rotation.z = -Math.cos(t * 0.30) * 0.06 * ramp;
      group.position.x = Math.sin(t * 0.21) * 16 * ramp;
      group.position.y = Math.sin(t * 0.5) * 7 * ramp + BASE_Y;
      group.position.z = Math.sin(t * 0.15) * 26 * ramp;
      var sc = 1 + Math.sin(t * 0.8) * 0.012;
      group.scale.set(sc, sc, sc);
    } else if (state === "exit") {
      var e2 = (t - exitStart) / 0.9;
      if (e2 < 0) e2 = 0;
      if (e2 >= 1) {
        state = "done";
        running = false;
        cancelAnimationFrame(rafId);
        mat.uniforms.uFade.value = 0;
        dustMat.uniforms.uFade.value = 0;
        window.dispatchEvent(new CustomEvent("hero:entered"));
        return;
      }
      var ee = e2 * e2;
      for (i = 0; i < count; i++) {
        i3 = i * 3;
        pos[i3] = targetP[i3] + (exitP[i3] - targetP[i3]) * ee;
        pos[i3 + 1] = targetP[i3 + 1] + (exitP[i3 + 1] - targetP[i3 + 1]) * ee;
        pos[i3 + 2] = targetP[i3 + 2] + (exitP[i3 + 2] - targetP[i3 + 2]) * ee;
      }
      geo.attributes.position.needsUpdate = true;
      mat.uniforms.uFade.value = 1 - ee;
      dustMat.uniforms.uFade.value = 1 - e2;
      group.rotation.y += 0.006;
    }

    camPos.x += (mouse.x * 34 - camPos.x) * 0.045;
    camPos.y += (-mouse.y * 24 - camPos.y) * 0.045;
    camera.position.x = camPos.x;
    camera.position.y = camPos.y;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  /* ---------------- Lifecycle ---------------- */
  function start() {
    if (running || state !== "idle") return;
    sampleFromImage().then(function (srcPts) {
      srcPts = srcPts || decodeEmbedded();
      if (!srcPts || !srcPts.pts || !srcPts.pts.length) {
        api.enabled = false;
        window.dispatchEvent(new CustomEvent("hero:fallback"));
        return;
      }
      lastSrc = srcPts;
      build(srcPts);
      initThree();
      bindEvents();
      state = "converge";
      clockT0 = performance.now();
      running = true;
      tick();
    });
  }

  function enter() {
    if (state === "exit" || state === "done") return;
    if (!running) return;
    exitStart = (performance.now() - clockT0) / 1000;
    state = "exit";
  }

  function replay() {
    if (state === "done") {
      if (!lastSrc) { start(); return; }
      build(lastSrc);
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aColor", new THREE.BufferAttribute(colorA, 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(sizeA, 1));
      geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphaA, 1));
      geo.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkleA, 1));
      group.rotation.set(0, 0, 0);
      group.position.set(0, BASE_Y, 0);
      group.scale.set(1, 1, 1);
      mat.uniforms.uFade.value = 1;
      dustMat.uniforms.uFade.value = 1;
      formedFired = false;
      state = "converge";
      clockT0 = performance.now();
      running = true;
      tick();
      return;
    }
    if (!running) { start(); return; }
    for (var i = 0; i < count * 3; i++) pos[i] = startP[i];
    geo.attributes.position.needsUpdate = true;
    group.rotation.set(0, 0, 0);
    group.position.set(0, BASE_Y, 0);
    group.scale.set(1, 1, 1);
    mat.uniforms.uFade.value = 1;
    dustMat.uniforms.uFade.value = 1;
    formedFired = false;
    state = "converge";
    clockT0 = performance.now();
  }

  function bindEvents() {
    window.addEventListener("mousemove", function (ev) {
      mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (ev.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        hiddenAt = performance.now();
        running = false;
        cancelAnimationFrame(rafId);
      } else if (state !== "done") {
        clockT0 += performance.now() - hiddenAt;
        running = true;
        tick();
      }
    });
  }

  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    // perspective-accurate point scale: drawingBufferHeight * 0.5 / tan(fov/2)
    var px = renderer.domElement.height * 0.5 /
             Math.tan((camera.fov * Math.PI / 180) * 0.5);
    mat.uniforms.uPixelScale.value = px;
    dustMat.uniforms.uPixelScale.value = px;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
})();
