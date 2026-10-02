/* ==========================================================================
 * NJAU E-Sports Club · Opening Xuanniao Point-Cloud Animation (M1 v4 修复版)
 * --------------------------------------------------------------------------
 * v4 修复(对照用户逐项反馈):
 *  P1 散开幅度:偏移系数 0.8~1.5 -> x0.5(0.40~0.75 模型单位,云轮廓约 1.5~1.8x
 *     鸟体),球面均匀方向不变;顶点着色器近裁剪保护(距相机 <0.5 单位 alpha->0)
 *  P2 粒子尺寸:uSizeBase 0.005 + uScaleFactor=height*0.5/tan(fov/2) 距离衰减,
 *     定格 1~2px / 散开 x1.6 约 2~3px;片元"小亮核+快速衰减"(core 占 ~1/4)
 *  P3 辉光:composer.render() 本就在主循环;threshold 0.4 / strength 1.15 /
 *     radius 0.5;追加晕层(同 geometry 第二遍渲染,点尺寸 x5,alpha 0.06,
 *     AdditiveBlending,只贡献氛围光)
 *  P4 边缘杂色团块:根因是 intro 内遗留的 DOM 像素 SVG 装饰(pix-deco),
 *     非 WebGL 粒子;CSS 隐藏(.intro .pix-deco{display:none})
 *  P5 色彩:PLY 加载后逐顶点 setRGB(..., SRGBColorSpace) 转线性,渲染管线不做
 *     二次 sRGB 编码(无 OutputPass),中调压深、饱和度恢复;核层 NormalBlending
 *  P6 动态:湍流 0.15->0.28;AfterimagePass 拖尾(damp:汇聚 0.75 / 散开·定格 0.3);
 *     uSwirl 权重曲线不变(4.5-6s 渐入 6s 峰值 6-8s 渐出)
 * R4(2026-09-17 出生/消亡改造):
 *  R4-1 aBirth/aDeath 逐粒子生命周期:生长 2.0+aBirth*1.65 / 消散 4.5+aDeath*1.3(0.4s 二次曲线淡灭)
 *      / 再生 6.0+aBirth*1.65(b2s=max(再生,死透) 保证 0.2s 尾迹重叠);星云 1.75~2.25s 整体退隐,
 *      未出生粒子 alpha=0 -> 「从胸口一点点长出/熄灭散尽」
 *  R4-2 核层 AdditiveBlending:alpha 0.50、亮核加宽(smoothstep 0.65)、过曝 (1.0+1.4*core)、
 *      uSizeBase 0.0062、twinkle 0.75+0.25 -> 躯干密度堆叠烧白,羽尖保留色彩
 *  R4-3 AfterimagePass damp 分段:0-2s 0.6 / 生长·消散·再生 0.88 / 停留 0.4 / 定格 0.15(逐帧 0.08 趋近)
 *  R4-4 衔接:权重曲线全连续;4-4.5s bloom ±15% 呼吸;径向光线改挂 5.3s 爆发峰(g5,opacity 0.30)
 * R5(2026-09-17 11s 时间轴 + 机位 + 爆发/残影;颜色已由主控修复,本版不动几何/PLY):
 *  R5-1 时间轴 8s->11s:0-1s 全黑+5% 稀疏尘埃(未出生 alpha=0,修上版满屏噪点回归)/
 *      1-4.5s 生长(3.5s)/ 4.5-5.2s 定格呼吸(bloom ±15% 正弦)/ 5.2-7s 消散(1.8s)/
 *      6.8-9.8s 再生(3s,与消散尾迹重叠 0.2s)/ 10-11s 定格(微浮 <=0.008、频率减半、damp<=0.15)
 *  R5-2 机位关键帧(球面插值,全程 smoothstep,首尾速度为零):远景静止->推轨 x1.5->x1.0
 *      ->微推->顶部俯视 ~70° 绕 y 旋 90°(星涡)->拉轨回平视->落回标准构图
 *  R5-3 爆发:径向光线弱化(opacity<=0.1、<=0.5s、去星芒),改 bloom 脉冲 x2 后 0.5s 回落
 *      + uBurst 粒子瞬时外扩 + damp 临时 0.9 甩丝;damp 分段 生长/消散 0.88、停留 0.4、定格 0.15
 *  新增 uniform:uBurst(默认 0.0)
 * 接口(与 main.js 衔接,勿改):window.NJAUEC_Hero.{enabled,start,enter,replay}
 * + 事件 hero:formed / hero:entered / hero:fallback。
 * ========================================================================== */
import * as THREE from "three";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from "three/addons/postprocessing/AfterimagePass.js";

const container = document.getElementById("opening-animation");
// 录制/调试:URL 带 ?fixedstep=1 时每帧固定推进 1/30s(供离线逐帧录屏,默认关闭)
const FIXED_STEP = new URLSearchParams(location.search).get("fixedstep") ? 1 / 30 : 0;
const api = { enabled: false, start, enter, replay, skip };
let skipped = false;
window.NJAUEC_Hero = api;

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) { return false; }
}

/* ---------------- 常量 ---------------- */
const PLY_URL = "assets/xuanniao_head_refined.ply?v=1";
const ORIGINAL_POINTS = 150000;
const FOV = 45;
const CAM_DIR = new THREE.Vector3(-1, 0.05, 0).normalize(); // -X 侧平视:头(+Z)朝画面右
const TARGET = new THREE.Vector3(0, 0.1, 0);                // 躯干中心(原点略上)
const LIFT_Y = 0.45;      // 鸟体整体上移
const LOOK_DROP = 0.3;    // lookAt 比鸟心低,鸟心位于画面上 2/5 处
const TIMELINE = 11.0; // Original animation time, reached at 11.9s wall time.
// Stretch only the existing 5.2–7.0s dispersion from 1.8s to 2.7s.
// All shader motion, births/deaths, turbulence, glow and re-formation stay original.
function animationTime(seconds) {
  if (seconds <= 5.2) return seconds;
  if (seconds < 7.9) return 5.2 + (seconds - 5.2) / 1.5;
  return seconds - 0.9;
}
const SCATTER_SCALE = 0.38;         // P1:偏移幅度系数(0.8~1.5 -> 0.30~0.57,云贴鸟身)
const BLOOM_BASE = 1.40, BLOOM_RADIUS = 0.55, BLOOM_THRESHOLD = 0.35; // P3(调色后阈值 0.4~0.5,只有高亮核过阈)
const FOG_COLOR = new THREE.Color(0x05070a);
const FOG_DENSITY = 0.12;
const TURB_AMP = 0.28;             // P6a:湍流幅度

let renderer, scene, camera, composer, bloomPass, afterimagePass, controls, birdGroup;
let pointsCore, pointsHalo, raysSprite;
let clock = new THREE.Clock(false);
let t = 0, exitT = -1, formedFired = false, loadDone = false, running = false;
let fitDist = 4, modelH = 2, modelW = 2.3;
let rafId = 0;
let loaderEl = null;

/* ---------------- 预生成随机量(固定种子 mulberry32(42)) ---------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let z = Math.imul(a ^ (a >>> 15), 1 | a);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

function buildAttributes(posArr, rng) {
  const n = posArr.length / 3;
  const scatter = new Float32Array(n * 3);
  const delay = new Float32Array(n);
  const size = new Float32Array(n);
  const seedA = new Float32Array(n);
  const birth = new Float32Array(n);   // 改造1:出生顺序(核心->羽尖 + 扰动)
  const death = new Float32Array(n);   // 改造1:消散顺序(核心先熄 + 扰动)
  const core = [0, 0.1, 0];
  let rmax = 0;
  for (let i = 0; i < n; i++) {
    const dx = posArr[i * 3] - core[0], dy = posArr[i * 3 + 1] - core[1], dz = posArr[i * 3 + 2] - core[2];
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (r > rmax) rmax = r;
  }
  for (let i = 0; i < n; i++) {
    // 球面均匀方向 x 幅度(修复单 1c):theta=h1*2pi, phi=acos(2*h2-1);
    // 幅度 0.32~0.60 模型单位 -> 云轮廓约 1.3~1.6x 鸟体,隐约可见鸟形,不糊满屏
    const th = rng() * Math.PI * 2;
    const ph = Math.acos(2 * rng() - 1);
    const mag = 0.15 + rng() * 0.30;              // 0.15~0.45:蓬松云贴鸟身,鸟形隐约可辨
    const spp = Math.sin(ph);
    scatter[i * 3] = spp * Math.cos(th) * mag;
    scatter[i * 3 + 1] = spp * Math.sin(th) * mag;
    scatter[i * 3 + 2] = Math.cos(ph) * mag;
    // 由躯干核心向羽尖的流动延迟
    const dx = posArr[i * 3] - core[0], dy = posArr[i * 3 + 1] - core[1], dz = posArr[i * 3 + 2] - core[2];
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const flow = Math.min(Math.max(r / rmax, 0), 1);
    delay[i] = Math.min(flow * 0.65 + rng() * 0.35, 0.999);
    size[i] = 0.5 + rng();
    seedA[i] = rng();
    // 由内向外排序 + 10% 扰动:生长/消散边缘呈羽状,非整齐弧线
    birth[i] = Math.min(Math.max(flow + (rng() - 0.5) * 0.2, 0), 1);
    death[i] = Math.min(Math.max(flow + (rng() - 0.5) * 0.2, 0), 1);
  }
  return { scatter, delay, size, seedA, birth, death };
}

/* ---------------- 着色器 ---------------- */
const NOISE_GLSL = `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
vec3 snoiseVec3(vec3 x){
  return vec3(
    snoise(x),
    snoise(x + vec3(31.416, -47.853, 12.679)),
    snoise(x + vec3(-233.145, 169.420, -113.970)));
}
vec3 curlNoise(vec3 p){
  const float e = 0.1;
  vec3 p0 = snoiseVec3(p);
  vec3 px = snoiseVec3(p + vec3(e, 0.0, 0.0));
  vec3 py = snoiseVec3(p + vec3(0.0, e, 0.0));
  vec3 pz = snoiseVec3(p + vec3(0.0, 0.0, e));
  float cx = (py.z - p0.z) - (pz.y - p0.y);
  float cy = (pz.x - p0.x) - (px.z - p0.z);
  float cz = (px.y - p0.y) - (py.x - p0.x);
  return vec3(cx, cy, cz) / e;
}
float easeInOutCubic(float x){
  return x < 0.5 ? 4.0*x*x*x : 1.0 - pow(-2.0*x + 2.0, 3.0) / 2.0;
}

`;

const VERT = NOISE_GLSL + `
attribute vec3 aScatterOffset;
attribute float aDelay;
attribute float aSize;
attribute float aSeed;
attribute float aBirth;
attribute float aDeath;
attribute float aRefine;
uniform float uTime, uGather1, uScatter2, uGather2, uSwirl, uExit, uBurst;
uniform float uScaleFactor, uSizeBase, uSizeMul;
varying vec3 vColor;
varying float vAlpha;
varying float vDepth;
varying float vDetail;
varying float vHi;
varying float vEye;
varying float vStill;
varying float vZone;
varying float vHeadLift;
void main() {
  vec3 home = position;
  vec3 sp1 = position + aScatterOffset;          // 初始散开位(0-2s 漂浮星云)
  vec3 sdir = normalize(aScatterOffset);         // 单位方向(模长恒 >0)
  vec3 homeJit = home + sdir * (0.05 * (0.4 + 0.6 * aSeed)); // 出生吸入起点:目标附近 0.05

  // R5:逐粒子出生/消亡时刻(11s 重排)
  // 出生 1.0~4.2(+0.3 淡入=3.5s) / 消散 5.2~6.6(+0.4 淡灭=1.8s) / 再生 6.8~9.5(+0.3=3.0s)
  float bT1 = 1.0 + aBirth * 3.2;
  float bT2 = 6.8 + aBirth * 2.7;
  float dT  = 5.2 + aDeath * 1.4;
  float dEnd = dT + 0.4;               // 最迟 7.0
  float b2s = max(bT2, dEnd);          // 同一粒子先死透再重生,尾迹自然重叠 0.2s

  float tt = uTime;
  vec3 p = home;
  float alpha = 1.0;
  float turbW = 0.0;
  float nebA = 1.0 - smoothstep(0.75, 1.0, tt); // 尘埃 1s 内退净,为出生让位
  if (tt < bT1) {
    // R5:0-1s 全黑 + 5% 稀疏尘埃缓漂;未出生粒子 alpha 恒 0(修上版满屏噪点回归)
    float dust = step(0.95, aSeed);
    p = sp1;
    alpha = nebA * dust * (0.30 + 0.20 * sin(uTime * 1.3 + aSeed * 40.0));
    turbW = 1.0;
  } else if (tt < bT1 + 0.3) {
    // 第一次生长:出生时刻从 homeJit 淡入吸入(0.3s)
    float k = (tt - bT1) / 0.3;
    p = mix(homeJit, home, k * k * (3.0 - 2.0 * k));
    alpha = k; turbW = 1.0 - k;
  } else if (tt < dT) {
    p = home;                          // 停留 + 4.5~5.2s 定格呼吸(bloom 脉动在 JS 侧)
  } else if (tt < dEnd) {
    // 消散:alpha 归零 + 外飘 0.1~0.2 + 湍流;漂移量带伪环绕切向扫掠(星涡)
    float k = clamp((tt - dT) / 0.4, 0.0, 1.0);
    vec3 off = sdir * (0.1 + 0.1 * aSeed) * k;
    float ang = uSwirl * 1.2;
    float cs = cos(ang), sn = sin(ang);
    off.xz = mat2(cs, -sn, sn, cs) * off.xz;
    p = home + off; alpha = (1.0 - k) * (1.0 - k); turbW = k;
  } else if (tt < b2s) {
    p = home; alpha = 0.0;             // 死透,等待重生
  } else if (tt < b2s + 0.3) {
    float k = (tt - b2s) / 0.3;        // 第二次生长(同出生逻辑)
    p = mix(homeJit, home, k * k * (3.0 - 2.0 * k));
    alpha = k; turbW = 1.0 - k;
  } else {
    // Hold the neck, head, eyes and crest at their sampled positions.
    // Feather the boundary below the neck; body/tail retain their original drift.
    float bodyDrift = 1.0 - smoothstep(0.15, 0.35, home.z);
    p.y += sin(uTime * (0.3 + aSeed * 0.4) + aSeed * 6.283) * 0.008 * smoothstep(9.6, 10.2, uTime) * bodyDrift;
  }
  p += sdir * uBurst * (0.10 + 0.10 * aSeed); // R5:爆发瞬时外扩(甩丝状光迹)
  if (turbW > 0.001) {                 // turbW 整批一致,停留/定格时跳过 12 次 snoise
    vec3 n = curlNoise(aScatterOffset * 1.5 + uTime * 0.15);
    p += n * float(${TURB_AMP}) * turbW;
  }
  p += aScatterOffset * (uExit * 2.2);           // 「进入首页」爆散

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mvPosition.z;
  // P2:尺寸随距离衰减;散开阶段 x1.6(定格 1~2px / 散开 2~3px);晕层由 uSizeMul 放大
  float sizeBoost = 1.0 + 0.6 * turbW;

  float headMul = 1.0 - 0.55 * smoothstep(0.45, 0.92, home.z); // 头部/颈部(+Z 前向)粒子缩小, 保五官轮廓
  gl_PointSize = aSize * uSizeBase * sizeBoost * headMul * uSizeMul * uScaleFactor / max(vDepth, 0.1);
    float radXZ = length(home.xz);
  float inCore = (1.0 - smoothstep(0.25, 0.55, radXZ)) * (1.0 - smoothstep(0.55, 0.95, abs(home.y)));
  vZone = clamp(inCore, 0.0, 1.0);   // 1=躯干核心(压制)  0=翅膀/尾羽(增益)

  float luma0 = dot(color, vec3(0.2126, 0.7152, 0.0722));
  // 细节/高光权重(按实测线性 luma 标定: 躯干~0.44 头部亮部~0.6+ 眼睛暗部~0.3)
  float headW = smoothstep(0.55, 0.95, home.z);
  float antlerW = smoothstep(0.10, 0.30, home.y) * headW;
  vDetail = clamp(headW * 1.0 + antlerW * 0.6, 0.0, 1.6);
  float darkW = 1.0 - smoothstep(0.18, 0.42, luma0);    // 暗细节(眼睛/颈纹)
  vEye = headW * darkW;
  float still = smoothstep(9.8, 10.8, uTime);
  float hiW = smoothstep(0.38, 0.62, luma0);            // 高亮粒子(线性空间实测标定)
  // Local exposure after re-formation: separate the lower torso hotspot
  // from the neck/head/crest. Masks use model coordinates so they follow orbiting.
  float neckHead = smoothstep(0.35, 0.85, home.z);
  float bodyW = (1.0 - smoothstep(0.28, 0.62, abs(home.x)))
    * smoothstep(-0.85, -0.45, home.z)
    * (1.0 - smoothstep(0.25, 0.65, home.z))
    * smoothstep(-0.72, -0.42, home.y)
    * (1.0 - smoothstep(0.08, 0.38, home.y));
  // The second hotspot is the sloping wing-root band beside the neck.
  // A feathered ellipse follows that band without dimming the neck or crest.
  float shoulderY = home.y + 0.15 - 0.45 * (home.z - 0.50);
  float shoulderRadius = length(vec2((home.z - 0.50) / 0.27, shoulderY / 0.12));
  float shoulderW = (1.0 - smoothstep(0.70, 1.45, shoulderRadius))
    * (1.0 - smoothstep(0.30, 0.62, abs(home.x)));
  vHi = still * max(bodyW, shoulderW) * (0.55 + 0.45 * hiW);
  vHeadLift = still * neckHead;
  // Slightly restore the tiny core dots, without enlarging their soft halos.
  // At the fitted camera distance the head's small dots can become subpixel.
  // Restore only their crisp footprint so green markings and eyes remain legible.
  float coreLayer = 1.0 - step(1.5, uSizeMul);
  gl_PointSize *= 1.0 + 0.35 * vHeadLift * coreLayer;
  gl_PointSize *= mix(1.0, 0.72, aRefine * coreLayer);
  vStill = still;                                     // 定格权重(供片元降 alpha)


  vColor = color;
  // P1 补充:近裁剪保护——距相机 <0.5 单位 alpha 归零
  float nearClip = smoothstep(0.5, 0.72, vDepth);
  // Pause the shimmer clock during the first hold; resume continuously on exit.
  // No brightness mask or inverse pulse compensation.
  float shimmerTime = uTime - clamp(uTime - 4.5, 0.0, 0.7);
  float twinkle = 0.75 + 0.25 * sin(shimmerTime * 2.6 + aSeed * 40.0);
  vAlpha = alpha * (1.0 - uExit * uExit) * nearClip * twinkle;
  // Extra texture samples appear only after re-formation and never emit halos.
  float denseHead = step(0.65, home.z) * (1.0 - step(0.3, abs(home.x)));
  float headEnergy = mix(1.0, 0.65, still * denseHead * coreLayer);
  vAlpha *= mix(headEnergy, still * coreLayer * 0.16, aRefine);
  gl_Position = projectionMatrix * mvPosition;
}
`;

// 核层:小亮核 + 快速衰减
const FRAG_CORE = `

float aces1(float x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
vec3 aces(vec3 x){ return vec3(aces1(x.r), aces1(x.g), aces1(x.b)); }
vec3 g2s(vec3 c){ return mix(c*12.92, 1.055*pow(max(c, vec3(0.0)), vec3(1.0/2.4)) - 0.055, step(vec3(0.0031308), c)); }
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uSatBoost;                          // 饱和度补偿(默认 1.35)
uniform float uBright;                            // 亮度补偿(默认 1.45)
varying vec3 vColor;
varying float vAlpha;
varying float vDepth;
varying float vZone;
varying float vDetail;
varying float vHi;
varying float vEye;
varying float vStill;
varying float vHeadLift;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv) * 2.0;
  if (d > 1.0) discard;
  float core = smoothstep(0.65, 0.0, d);         // R4:亮核加宽,密度堆叠躯干烧白
  float skirt = smoothstep(1.0, 0.65, d) * 0.3;  // 快速衰减的薄裙边
  float a = clamp(core + skirt, 0.0, 1.0);
  // 颜色补偿:先绕 luma 提饱和,再整体提亮;基层钳到 1.0 防爆色,
  // 亮核乘区保留过曝(>1.0)以越过 bloom 阈值
  vec3 col = vColor;
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(luma), col, uSatBoost);
  col *= uBright;                               // 微量饱和度/亮度(<=1.05)
   // 几何分区反向调节: 翅膀/尾羽(外围)增益, 躯干核心(中轴)压制
   col *= mix(1.15, 0.55, vZone);
   col *= (1.0 + 0.85 * vDetail);                  // 眼/颈/角/身 细节提亮
   col *= (1.0 + 0.70 * vEye);                  // 眼睛/颈纹暗细节对比增强
  col *= (1.0 + 1.4 * core);                    // 亮核过曝 -> 供 bloom 取阈
  col = aces(col);                          // 高光平滑滚向白, 替代逐通道 clamp(不产生色相偏移)
  col = g2s(col);                          // 线性->sRGB 输出编码(修整体偏暗)
  float f = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
  col = mix(col, uFogColor, clamp(f, 0.0, 1.0));
  // Apply exposure to additive energy after tone mapping; pre-ACES gains
  // barely affect already bright dots and cannot resolve dense overlap.
  float localExposure = (1.0 - 0.58 * vHi) * (1.0 + 0.65 * vHeadLift);
  gl_FragColor = vec4(col * mix(1.0, 1.09, vStill), a * vAlpha * 0.55 * localExposure);
}
`;

// 晕层:大而柔、极低透明度,只贡献氛围光
const FRAG_HALO = `

float aces1(float x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
vec3 aces(vec3 x){ return vec3(aces1(x.r), aces1(x.g), aces1(x.b)); }
vec3 g2s(vec3 c){ return mix(c*12.92, 1.055*pow(max(c, vec3(0.0)), vec3(1.0/2.4)) - 0.055, step(vec3(0.0031308), c)); }
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uSatBoost;
uniform float uBright;
varying vec3 vColor;
varying float vAlpha;
varying float vDepth;
varying float vZone;
varying float vDetail;
varying float vHi;
varying float vEye;
varying float vStill;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv) * 2.0;
  if (d > 1.0) discard;
  float a = smoothstep(1.0, 0.0, d);
  a = a * a * 0.07;
  vec3 col = vColor;
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(luma), col, uSatBoost);         // 与核层一致的颜色补偿
  col *= uBright;
   // 几何分区反向调节: 翅膀/尾羽(外围)增益, 躯干核心(中轴)压制
   col *= mix(1.15, 0.55, vZone);
   col *= (1.0 + 0.85 * vDetail);                  // 眼/颈/角/身 细节提亮
   col *= (1.0 + 0.70 * vEye);                  // 眼睛/颈纹暗细节对比增强
  col = aces(col);
  col = g2s(col);
  float f = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
  col = mix(col, uFogColor, clamp(f, 0.0, 1.0));
  // Reduce the torso's washed-out glow while retaining crisp head details.
  gl_FragColor = vec4(col, a * vAlpha * (1.0 - 0.65 * vHi));
}
`;

/* ---------------- 径向光线贴图(程序生成) ---------------- */
function makeRaysTexture() {
  const S = 512, cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const ctx = cv.getContext("2d");
  const g = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.25, "rgba(255,255,255,0.25)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  // R5:去十字星芒/径向光线,只留柔和径向渐变光晕
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------------- 场景 ---------------- */
function boot() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  afterimagePass = new AfterimagePass(0.3);       // P6b:拖尾,damp 动态控制
  composer.addPass(afterimagePass);
  bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), BLOOM_BASE, BLOOM_RADIUS, BLOOM_THRESHOLD);
  composer.addPass(bloomPass);

  raysSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRaysTexture(), color: 0x9fd8e8, transparent: true,
    opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
  }));
  raysSprite.scale.set(5, 5, 1);
  raysSprite.position.set(0.4, TARGET.y + LIFT_Y, 0);
  scene.add(raysSprite);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(TARGET.x, TARGET.y + LIFT_Y - LOOK_DROP, TARGET.z);
  controls.enableDamping = true;
  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = Math.PI * 5 / 6;
  controls.enabled = false;

  loaderEl = document.createElement("div");
  loaderEl.className = "oa-loader";
  container.appendChild(loaderEl);

  new ResizeObserver(resize).observe(container);
  resize();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) clock.getDelta();      // 清空切后台累积的时间差
  });
}

function resize() {
  const w = container.clientWidth || 1, h = container.clientHeight || 1;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const sf = renderer.domElement.height * 0.5 / Math.tan(THREE.MathUtils.degToRad(FOV) * 0.5);
  if (pointsCore) pointsCore.material.uniforms.uScaleFactor.value = sf;
  if (pointsHalo) pointsHalo.material.uniforms.uScaleFactor.value = sf;
  if (!controls.enabled) {
    fitDist = computeFit();
    placeCamera(animationTime(t));
  }
}

function computeFit() {
  const fovRad = THREE.MathUtils.degToRad(FOV);
  const fitH = (modelH / 0.66) / (2 * Math.tan(fovRad / 2));
  const fitW = (modelW / 0.85) / (2 * Math.tan(fovRad / 2) * camera.aspect);
  return Math.max(fitH, fitW);
}

function lookY() { return TARGET.y + LIFT_Y - LOOK_DROP; }

/* R5 机位关键帧:[t, 距离倍率, 俯角增量 deg, 绕 y 方位角 deg](相对基准平视构图)
 * 段间 smoothstep 缓动 -> 每个关键帧速度为零;球面参数插值,无欧拉跳变 */
const CAM_KEYS = [
  [0.0,  1.50,  8,   0],   // 远景静止(标准构图 x1.5)
  [1.0,  1.50,  8,   0],
  [4.5,  1.00,  0,   0],   // 由远及近推轨 + 轻微俯冲(高度角下放)
  [5.2,  0.92,  0,   0],   // 微推
  [7.0,  0.78, 67,  90],   // 顶部俯视 ~70° + 绕 y 旋 ~90°,与消散同步呈星涡
  [10.0, 1.00,  0,   0],   // 由近及远拉轨 + 回平视(球面插值)
  [11.0, 1.00,  0,   0],   // 落回标准构图(fitH/fitW),静止
];
function smoothstepJS(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
function camPose(tt) {
  let i = 0;
  while (i < CAM_KEYS.length - 2 && tt > CAM_KEYS[i + 1][0]) i++;
  const a = CAM_KEYS[i], b = CAM_KEYS[i + 1];
  const k = smoothstepJS((tt - a[0]) / Math.max(b[0] - a[0], 1e-6));
  return {
    dist: a[1] + (b[1] - a[1]) * k,
    el: (a[2] + (b[2] - a[2]) * k) * Math.PI / 180,
    az: (a[3] + (b[3] - a[3]) * k) * Math.PI / 180
  };
}
const _camDir = new THREE.Vector3(), _camLook = new THREE.Vector3();
function placeCamera(tt) {
  const pose = camPose(tt);
  _camLook.set(TARGET.x, lookY(), TARGET.z);
  // 基准方向 CAM_DIR 的球面参数 + 关键帧偏移(球面插值)
  const el = Math.asin(CAM_DIR.y) + pose.el;
  const az = Math.atan2(CAM_DIR.z, CAM_DIR.x) + pose.az;
  _camDir.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  camera.position.copy(_camLook).addScaledVector(_camDir, fitDist * pose.dist);
  camera.lookAt(_camLook);
}
function easeInOutCubicJS(x) { return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2; }
function easeOutCubicJS(x) { return 1 - Math.pow(1 - x, 3); }
function clamp01(x) { return Math.min(Math.max(x, 0), 1); }

/* ---------------- PLY 加载与几何构建 ---------------- */
function start() {
  if (running || loadDone) return;
  running = true;
  new PLYLoader().loadAsync(PLY_URL).then((geo) => {
    buildPoints(geo);
    geo.dispose();
    loadDone = true;
    if (loaderEl) { loaderEl.remove(); loaderEl = null; }
    t = 0; exitT = -1; formedFired = false;
    clock.start();
    if (!skipped) rafId = requestAnimationFrame(frame);
    else running = false;
  }).catch(() => {
    api.enabled = false;
    window.dispatchEvent(new CustomEvent("hero:fallback"));
  });
}

function makePointMaterial(frag, sizeMul, blending) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: frag,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: blending,
    uniforms: {
      uTime: { value: 0 }, uGather1: { value: 0 }, uScatter2: { value: 0 },
      uGather2: { value: 0 }, uSwirl: { value: 0 }, uExit: { value: 0 }, uBurst: { value: 0.0 },
      uScaleFactor: { value: 1086 }, uSizeBase: { value: 0.0062 }, uSizeMul: { value: sizeMul },
      uFogColor: { value: FOG_COLOR }, uFogDensity: { value: FOG_DENSITY },
      uSatBoost: { value: 1.15 }, uBright: { value: 1.05 }
    }
  });
}

function syncUniforms(u, src) {
  u.uTime.value = src.uTime.value;
  u.uGather1.value = src.uGather1.value;
  u.uScatter2.value = src.uScatter2.value;
  u.uGather2.value = src.uGather2.value;
  u.uSwirl.value = src.uSwirl.value;
  u.uExit.value = src.uExit.value;
  u.uBurst.value = src.uBurst.value;
}

function buildPoints(plyGeo) {
  const posFull = plyGeo.attributes.position.array;
  const colFull = plyGeo.attributes.color ? plyGeo.attributes.color.array : null;
  const total = posFull.length / 3;
  const rng = mulberry32(42);
  const originalAttrs = buildAttributes(posFull.subarray(0, ORIGINAL_POINTS * 3), rng);
  const refinedAttrs = buildAttributes(posFull, mulberry32(81));

  // A narrow desktop window is not a phone: halving its particles made the
  // live animation much darker than the full-density recorded version.
  const MOBILE = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
                 /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const target = MOBILE ? 60000 : ORIGINAL_POINTS;
  const stride = Math.max(1, Math.floor(ORIGINAL_POINTS / target));

  const n = Math.ceil(total / stride);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const sc = new Float32Array(n * 3);
  const dl = new Float32Array(n), sz = new Float32Array(n), sd = new Float32Array(n);
  const bn = new Float32Array(n), dt2 = new Float32Array(n);
  const refine = new Float32Array(n);
  const tmpC = new THREE.Color();
  let j = 0;
  for (let i = 0; i < total; i += stride, j++) {
    const attrs = i < ORIGINAL_POINTS ? originalAttrs : refinedAttrs;
    refine[j] = i < ORIGINAL_POINTS ? 0 : 1;
    pos[j*3] = posFull[i*3]; pos[j*3+1] = posFull[i*3+1]; pos[j*3+2] = posFull[i*3+2];
    if (colFull) {
      // P5a:sRGB -> linear,恢复羽毛饱和层次
      tmpC.setRGB(colFull[i*3], colFull[i*3+1], colFull[i*3+2], THREE.SRGBColorSpace);
      col[j*3] = tmpC.r; col[j*3+1] = tmpC.g; col[j*3+2] = tmpC.b;
    } else {
      col[j*3] = col[j*3+1] = col[j*3+2] = 0.42;
    }
    sc[j*3] = attrs.scatter[i*3]; sc[j*3+1] = attrs.scatter[i*3+1]; sc[j*3+2] = attrs.scatter[i*3+2];
    dl[j] = attrs.delay[i]; sz[j] = attrs.size[i]; sd[j] = attrs.seedA[i];
    bn[j] = attrs.birth[i]; dt2[j] = attrs.death[i];
  }

  let mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
  for (let i = 0; i < ORIGINAL_POINTS; i++) {
    for (let a = 0; a < 3; a++) {
      const v = posFull[i*3+a];
      if (v < mn[a]) mn[a] = v;
      if (v > mx[a]) mx[a] = v;
    }
  }
  modelH = mx[1] - mn[1];
  modelW = mx[2] - mn[2];

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aScatterOffset", new THREE.BufferAttribute(sc, 3));
  g.setAttribute("aDelay", new THREE.BufferAttribute(dl, 1));
  g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
  g.setAttribute("aSeed", new THREE.BufferAttribute(sd, 1));
  g.setAttribute("aBirth", new THREE.BufferAttribute(bn, 1));
  g.setAttribute("aDeath", new THREE.BufferAttribute(dt2, 1));
  g.setAttribute("aRefine", new THREE.BufferAttribute(refine, 1));
  container.dataset.headExtraPoints = String(total - ORIGINAL_POINTS);

  // 核层:锐利小光点,NormalBlending 保持色彩
  birdGroup = new THREE.Group();
  birdGroup.position.y = LIFT_Y;
  pointsCore = new THREE.Points(g, makePointMaterial(FRAG_CORE, 1.0, THREE.AdditiveBlending));
  pointsCore.frustumCulled = false;
  // P3 晕层:同 geometry 再渲染一遍,AdditiveBlending,只贡献氛围
  pointsHalo = new THREE.Points(g, makePointMaterial(FRAG_HALO, 3.2, THREE.AdditiveBlending));
  pointsHalo.frustumCulled = false;
  birdGroup.add(pointsHalo);
  birdGroup.add(pointsCore);
  scene.add(birdGroup);
  fitDist = computeFit();
  placeCamera(0);
  resize();
}

/* ---------------- 主循环 ---------------- */
function frame() {
  rafId = requestAnimationFrame(frame);
  const dt = FIXED_STEP || Math.min(clock.getDelta(), 0.1);
  if (exitT < 0) t += dt; else exitT += dt;

  const u = pointsCore.material.uniforms;
  const effectT = animationTime(t);
  u.uTime.value = effectT;
  window.__oaT = t;                    // 录制自检:当前动画时刻
  document.documentElement.setAttribute("data-oa-t", t.toFixed(4));  // 隔离作用域可读的 DOM 钩子
  u.uGather1.value = clamp01((effectT - 1.0) / 3.5);
  u.uScatter2.value = clamp01((effectT - 5.2) / 1.8);
  u.uGather2.value = clamp01((effectT - 6.8) / 3.0);
  u.uSwirl.value = easeOutCubicJS(u.uScatter2.value) * (1 - u.uGather2.value);

  // Retain the original particle displacement pulse, without a bloom flash.
  const burstK = effectT >= 5.2 ? smoothstepJS((effectT - 5.2) / 0.06) * Math.exp(-(effectT - 5.2) / 0.18) : 0;
  u.uBurst.value = burstK;
  syncUniforms(pointsHalo.material.uniforms, u);

  // Preserve opening/final settings; no historical frames during the moving-camera stages.
  let dampTarget;
  if (exitT >= 0) dampTarget = 0.30;
  else if (effectT < 1.0) dampTarget = 0.6;    // 稀疏尘埃缓漂
  else if (effectT < 4.5) dampTarget = 0.88;   // 第一次生长
  else if (effectT < 5.2) dampTarget = 0.4;    // 定格呼吸
  else if (effectT < 10.0) dampTarget = 0.0;  // 运镜期间不保留历史帧
  else dampTarget = 0.0;                 // 自由转动时清除上一视角的历史影像
  // Clear history immediately: easing down from 0.9 would still leave ghosts.
  if (effectT >= 4.5) afterimagePass.uniforms["damp"].value = 0.0;
  else afterimagePass.uniforms["damp"].value += (dampTarget - afterimagePass.uniforms["damp"].value) * 0.08;

  // Constant glow: the old three-half-wave first-hold pulse caused visible flashes.
  let bloomStrength = BLOOM_BASE;
  bloomPass.strength = bloomStrength;
  // Narrow only the final hold's glow footprint, keeping core energy intact.
  const finalGlow = smoothstepJS((effectT - 9.8) / 1.2);
  bloomPass.strength *= 1.0 - 0.90 * finalGlow;
  pointsHalo.material.uniforms.uSizeMul.value = 3.2 - 1.6 * finalGlow;
  bloomPass.radius = BLOOM_RADIUS * (1 - finalGlow) + 0.12 * finalGlow;
  bloomPass.threshold = BLOOM_THRESHOLD;
  // R5:径向光线弱化——opacity <= 0.1、时长 <= 0.5s(随爆发脉冲衰减)
  raysSprite.material.opacity = 0;
  const rs = 5 * (1 + 0.10 * burstK);
  raysSprite.scale.set(rs, rs, 1);

  if (exitT >= 0) {
    const e = clamp01(exitT / 0.9);
    u.uExit.value = e * e;
    pointsHalo.material.uniforms.uExit.value = e * e;
    bloomPass.strength *= 1 - e;
    raysSprite.material.opacity *= 1 - e;
    if (e >= 1) {
      cancelAnimationFrame(rafId);
      running = false;
      window.dispatchEvent(new CustomEvent("hero:entered"));
      return;
    }
  }

  if (!controls.enabled) placeCamera(effectT);
  else controls.update();

  if (!formedFired && effectT >= TIMELINE && exitT < 0) {
    formedFired = true;
    controls.enabled = true;
    controls.update();
    window.dispatchEvent(new CustomEvent("hero:formed"));
  }
  composer.render();
}

/* ---------------- 进入首页 / 重播 ---------------- */
function enter() {
  if (!loadDone || exitT >= 0) return;
  exitT = 0;
}
function skip() {
  skipped = true;
  cancelAnimationFrame(rafId);
  running = false;
  if (controls) controls.enabled = false;
  window.dispatchEvent(new CustomEvent("hero:entered"));
}
function replay() {
  skipped = false;
  if (!loadDone) return;
  if (!running) { running = true; rafId = requestAnimationFrame(frame); }
  t = 0; exitT = -1; formedFired = false;
  pointsCore.material.uniforms.uExit.value = 0;
  pointsHalo.material.uniforms.uExit.value = 0;
  controls.enabled = false;
  fitDist = computeFit();
  placeCamera(0);
  clock.getDelta();
}

/* ---------------- 启动(置于末尾,避开 let/const TDZ) ---------------- */
if (container && webglOK()) {
  api.enabled = true;
  boot();
}
// 否则 enabled=false -> main.js 走静态 logo 回退
