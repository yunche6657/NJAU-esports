# NJAU 电竞社官网开发交接文档 (Project Handover)

> **文档创建时间**：2026-10-01  
> **适用对象**：Codex 新会话 / 后续接手开发的前端工程师  
> **项目定位**：南京农业大学电竞社 (NJAU E-Sports Club) 官方宣传网站前端工程  

---

## 1. 运行环境与技术规范

* **工程根目录**：`C:/Users/Administrator/Documents/Codex/2026-09-06/x`
* **前端资源根目录**：`C:/Users/Administrator/Documents/Codex/2026-09-06/x/site/frontend`
* **本地开发预览地址**：`http://127.0.0.1:4173/`（由 Python 简易 HTTP 服务常驻托管，调试时请勿关闭）
* **架构选型**：
  * **零重型打包器、纯原生体系**：原生 HTML5 + CSS3 + 现代 ES6 模块化，无 Webpack/Vite 繁复配置，开箱即开跑。
  * **3D 粒子视效**：基于 Three.js r160（主入口为 `js/hero-pointcloud.js`，3D 模型资产为 `assets/model/xuanniao.glb`）。
* **全局设计语言 (Design Tokens)**：
  * **整体基调**：明亮青春 · 糖果活力风。
  * **主色调**：浅色薄荷底（`--c-bg: #f4fffb`）、活力青（`--c-primary: #00c2a8`）、墨绿文字（`--c-ink: #0e3b36`）。
  * **圆角与质感**：大圆角（`--r-lg: 24px`）、马卡龙轻量阴影、像素元素仅做点缀装饰（`.pix`、`svg#pix-*`），绝非纯像素复古站。

---

## 2. 当前已 100% 验收落地的开发成果清单

本工程各主要模块已完成像素级微调与多轮浏览器验收：

### ① 开场与玄鸟 3D 粒子视效 (`#intro`)
* 全屏开场 3D 粒子动画，支持鼠标移动时产生空间视差。
* 提供“跳过动画”与“进入首页”按钮，点击后平滑淡出并解开全屏滚动锁定。
* 包含 WebGL 降级兼容机制（不支持 WebGL 时自动展示备用静态玄鸟 Glow 图）。

### ② 八大游戏分部立绘对齐与交互 (`#games`)
所有分部立绘均已完成像素级尺寸对齐与边缘严丝合缝校验（**立绘脚底严禁悬空，严格贴合卡片上边缘**）：
1. **守望先锋 (`#f99e1a`)**：
   * 三角色配置：源氏（`character-01-genji.png`）、麦克雷（`character-02-mccree.png`）、猎空（`character-03.png`）。
   * **关键对齐参数**：猎空（Tracer）缩放比例调整为 `0.88`，配合 `translateY(5px)`，**头部高度与麦克雷帽檐水平齐平，脚底紧贴卡片边缘**。
2. **英雄联盟 (`#c77dff`)**：
   * 三角色配置：双形态千珏（1号位）、格温（2号位）、亚索（3号位）。
   * **千珏双形态交互**：默认状态为 `character-01-a.png`，点击后平滑切换为面具细节改变状态 `character-01-b.png`，内部已完成预加载以保证零闪烁。
   * **贴边补偿**：通过 `translateY(35px)` 与 `translateY(18px)` 抹平透明留白，脚底严格紧贴卡片边缘。
3. **第五人格 (`#9b8cff`)**：
   * 三角色配置到位，中间 2 号角色已替换为高清无白边透明版本，缩放比例适配为 `0.96` 居中展示。
4. **瓦罗兰特 (`#ff5d73`)**：
   * 3 个人物立绘到位，脚底利用 `feet-edge2` 样式紧贴卡片顶缘。
5. **CS2 (`#ff9f45`)**：
   * 3 个人物立绘配置完成，支持台词语音互动彩蛋（`js/cs2-art.js`）。
6. **王者荣耀 (`#ffd166`)**：
   * 公孙离等立绘互动就绪，包含伞旋转音效与落樱粒子效果（`js/wangzhe-art.js`、`css/wangzhe-art.css`）。
7. **三角洲行动 (`#2ec4b6`)** & **永劫无间 (`#4cc9f0`)**：
   * 战术武器与角色立绘配置完成。

### ③ 分部加群与社团大群弹窗系统
* 采用原生 `<dialog>` 架构：
  * 社团招新主群窗口（`#bloom-dialog`）。
  * 8 大分部独立加群窗口（`#division-dialog`）。
* 支持动态分部群名、群号一键复制（含剪贴板权限失败兜底 Toast）、二维码展示与保存下载、QQ 官方加群直达。

### ④ 招新表单与数据统计 (`#apply`, `#about`)
* 表单字段校验、分部多选 chip 动态生成绑定。
* 统计数字滚动加载动画已对接完毕。

---

## 3. 核心文件索引

| 文件路径 | 作用说明 |
| :--- | :--- |
| [`site/frontend/index.html`](file:///C:/Users/Administrator/Documents/Codex/2026-09-06/x/site/frontend/index.html) | 主站页面入口骨架 |
| [`site/frontend/css/tokens.css`](file:///C:/Users/Administrator/Documents/Codex/2026-09-06/x/site/frontend/css/tokens.css) | 色彩、字体、圆角、阴影等设计令牌 |
| [`site/frontend/css/base.css`](file:///C:/Users/Administrator/Documents/Codex/2026-09-06/x/site/frontend/css/base.css) | 基础重置与全局排版 |
| [`site/frontend/css/components.css`](file:///C:/Users/Administrator/Documents/Codex/2026-09-06/x/site/frontend/css/components.css) | 按钮、药丸胶囊、卡片基础类 |
| [`site/frontend/css/sections.css`](file:///C:/Users/Administrator/Documents/Codex/2026-09-06/x/site/frontend/css/sections.css) | 各屏排版与立绘定位尺寸参数 |
| [`site/frontend/js/data.js`](file:///C:/Users/Administrator/Documents/Codex/2026-09-06/x/site/frontend/js/data.js) | 本地兜底数据（分部、QQ群、立绘路径、活动） |
| [`site/frontend/js/main.js`](file:///C:/Users/Administrator/Documents/Codex/2026-09-06/x/site/frontend/js/main.js) | 核心业务交互（分部立绘动效、弹窗交互、表单） |

---

## 4. 接手开发规范与纪律

1. **修改前强制备份**：对任何文件进行重大改动前，务必创建 `.bak` 备份文件（如 `index.html.bak-xxx`），确保随时可退回。
2. **立绘贴边红线**：修改立绘位置时，必须确保立绘脚部贴紧卡片顶边，不可留出悬空空白。
3. **保持测试轻量**：调试网页样式优先通过本地服务 `http://127.0.0.1:4173/` 验证，不要引入额外的打包编译命令。
