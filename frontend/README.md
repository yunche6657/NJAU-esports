# NJAU 电竞社官网 · 前端 M1

明亮青春 · 糖果活力风：浅色为底、活力青主色（#00c2a8）、糖果色点缀、大圆角卡片，
像素风只做点缀（像素符号 / 彩带 / 二维码占位图标），不做全站像素、不做深底霓虹。

M1 交付：开场 3D 粒子 logo（Three.js）+ 首页 7 节可滚动骨架 + 可扩展设计体系。
无构建步骤、暂不接后端（数据写死在 js/data.js，契约注释已留）。

## 目录结构

```
frontend/
|- index.html               单页入口（相对路径引用全部资源）
|- README.md
|- css/
|  |- tokens.css            设计令牌：配色 / 圆角 / 阴影 / 间距 / 字体 / 动效 / 层级
|  |- base.css              reset、排版、糖果光斑背景、reveal 工具类、像素基类
|  |- components.css        导航、按钮、卡片、chip、节标题、统计、时间线、表单、toast
|  `- sections.css          开场 overlay、7 节区块、页脚、响应式
|- js/
|  |- logo-points.js        [生成] 预采样粒子点集（base64），file:// 直开回退用
|  |- data.js               占位数据 + 后端契约注释（GET /api/config 等）
|  |- hero-particles.js     开场 3D 粒子 logo（采样/聚合/视差/衰减/过渡）
|  `- main.js               导航、揭示、数字滚动、分部与表单渲染、开场衔接
|- assets/
|  |- logo-main.jpg         原始 logo（AI 生成、无透明底）
|  |- logo-main-masked.png  [生成] 阈值抠底后的透明底 logo
|  `- logo-alt.jpg / reference-style.jpg   备用素材
`- tools/
   `- make_logo_mask.py     离线工具：抠底 + 预采样（Pillow，跑一次即可）
```

## 如何预览

方式 A（推荐，完整体验运行时采样）：

```bash
cd site/frontend
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

方式 B（双击直开）：直接打开 index.html 亦可。
file:// 下浏览器禁止 canvas 读回本地图片，粒子自动改用 js/logo-points.js
预采样点集（与运行时采样同一套阈值规则），视觉一致。

外部依赖仅两个 CDN（离线时自动降级）：
- Three.js r152（jsdelivr UMD）；加载失败时开场降级为静态透明底 logo + 进入按钮。
- Google Fonts：ZCOOL KuaiLe（中文标题）/ Baloo 2（圆体数字与英文）；失败回退系统字体。

## 开场粒子实现要点

1. 取点：http(s) 下运行时对 assets/logo-bird.jpg 先采样四角自动识别背景：
   角落 >=80% 中性色 -> 棋盘/中性底模式，前景 = 色度差 chroma>3；
   否则单色底模式，前景 = 与角落均值欧氏距离 >50；再经密度滤波去 JPEG 噪点，
   并剔除底部文字带（开场只保留飞行的玄鸟）。离线工具 tools/make_logo_mask.py
   用同一规则 + 中值/闭运算/连通域过滤，产出发光版 PNG 与预采样点集。
2. 成形：粒子自外层球壳带旋涡汇聚（per-particle delay + easeOutCubic），
   完成后派发 hero:formed → 显示「进入首页」。
3. 3D：目标点带 ±20 世界单位 Z 厚度；整体绕 Y 轴缓慢摆动旋转 + 上下浮动；
   鼠标位置 lerp 到相机形成视差。
4. 衰减与辉光：自定义 ShaderMaterial，按视深衰减 大小 / 透明度 / 辉光，并加闪烁；
   intro 为深空底，使用 AdditiveBlending 发光粒子（电光青 #22E4FF / 发光薄荷
   #00FFC8 / 天蓝 #38B6FF / 冰白 #F0FFFF，5% 糖果星点 #FFD166 #FF5D8A）。
4b. 飞行动效：成形后翼区粒子按离体轴距离增幅上下扑动（带沿翼行进波相位），
   尾羽区慢摆、身体起伏、整体 3D 弧线滑翔 + 转弯侧倾。
5. 过渡：点击「进入首页」→ 粒子向外爆散淡出（hero:entered）→ overlay 缩放淡出、
   解锁滚动、平滑落入首屏；首屏提供「重播开场动画」。

## 重新生成 logo 掩膜 / 点集（换 logo 时才需要）

```bash
cd site/frontend
python tools/make_logo_mask.py
```

## 后端对接预留

见 js/data.js 顶部注释：GET /api/config 的 games[] 每项含
{ id, name, name_en, theme }；替换为 fetch 后渲染层无需改动。
表单提交在 M3 接 POST /api/apply（当前为前端校验 + 演示 toast）。

## 浏览器支持

现代浏览器（Chrome / Edge / Firefox / Safari 近两年版本）。
prefers-reduced-motion 下关闭动效；无 WebGL / 无 JS 均有降级路径。
