# NJAU 电竞社官网后端 · Cloudflare Worker 版（M3）

与原 Node 版（`site/backend/server.js`）**接口契约完全一致**（见 `../docs/API.md`），
数据从 JSON 文件换成 Cloudflare D1（SQLite）。前端无需改动。

## 目录

```
backend-cf/
├── worker.js       # 全部逻辑（单文件，无外部依赖）
├── schema.sql      # D1 表结构（applications 表）
├── wrangler.toml   # 部署配置（database_id 待创建后填入）
├── dev-local.mjs   # 本地开发启动器（miniflare，端口 8787）
├── package.json    # wrangler 依赖
└── .dev.vars       # 本地密钥（ADMIN_KEY），不要提交/公开
```

## 本地开发

```bash
npm install          # 若 npm 缓存目录报权限错，加 --cache <工作区内目录>
node dev-local.mjs   # 启动 http://127.0.0.1:8787（自动建表，数据内存态，重启清空）
```

本地管理密钥默认 `njau-local-test-2026`（写在 dev-local.mjs，仅本地）。

## 查看报名数据（三种方式）

| 方式 | 操作 |
| --- | --- |
| ① Cloudflare 后台 | dash.cloudflare.com → Workers 和 Pages → D1 → njau-esports → 浏览 `applications` 表 |
| ② 管理接口 JSON | 浏览器/脚本请求 `GET /api/apply/list`，头 `Authorization: Bearer <ADMIN_KEY>` |
| ③ 导出 Excel | `GET /api/apply/list?format=csv`（同样带头），CSV 带 BOM，Excel 直接打开不乱码 |

## 部署到 Cloudflare（一次性步骤）

```bash
npx wrangler login                                        # 浏览器授权你的 CF 账号
npx wrangler d1 create njau-esports                       # 记下返回的 database_id
# 把 database_id 填进 wrangler.toml
npx wrangler d1 execute njau-esports --remote --file=schema.sql
npx wrangler secret put ADMIN_KEY                         # 设置管理密码（查报名用）
npx wrangler deploy                                       # 得到 https://njau-esports-api.<你的子域>.workers.dev
```

前端静态站上 Cloudflare Pages 后，把 `/api/*` 路由到该 Worker
（Pages 的 `_routes.json` 或自定义域绑定），`main.js` 里的 `API_BASE` 逻辑已自动适配：
本地预览（4173）时请求打到 8787，线上同源直接走 `/api/*`。

## 接口一览（契约见 ../docs/API.md）

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| GET | /api/config | 站点配置 + 7 分部 + 群信息 | 无 |
| GET | /api/activities | 历史活动（暂返回 []） | 无 |
| GET | /api/honors | 战报荣誉（暂返回 []） | 无 |
| POST | /api/apply | 提交报名（name/contact/games 必填，grade/major/intro 可选） | 无 |
| GET | /api/apply/stats | 各分部人数统计 | 无 |
| GET | /api/apply/list | 全部报名明细，?format=csv 导出 | Bearer ADMIN_KEY |

游戏 id 枚举：`valorant / cs2 / wangzhe / delta / naraka / identityv / lol`

## 已验证（2026-09-24 本地实测）

- 全部 6 个接口通过：config 七分部 id 与前端一致、报名写入/统计/明细/CSV 正确、
  非法 id 与缺必填项返回 400 字段级错误、管理接口无密钥 401
- 前端表单（localhost:4173）真实提交 → Worker 落库 → 管理接口读回，端到端通过
- 旧 Node 版 server.js 保留在 `site/backend/`，两套实现契约一致，可随时切换
