# NJAU 电竞社：GitHub 与 Cloudflare 部署

## 推送到 GitHub

在项目根目录执行：

```powershell
git init
git branch -M main
git remote add origin https://github.com/yunche6657/NJAU-esports.git
git add .
git commit -m "Prepare NJAU esports site for deployment"
git push -u origin main
```

如果本地已经有 `origin`，把 `git remote add origin ...` 换成：

```powershell
git remote set-url origin https://github.com/yunche6657/NJAU-esports.git
```

浏览器或 Git Credential Manager 出现 GitHub 登录提示时，用自己的 GitHub 登录方式完成认证；不要把 Token 写进命令或提交到仓库。

## Cloudflare Pages + Pages Functions + D1（当前方案）

仓库已经准备好 Pages 的构建入口：

- Root directory：仓库根目录
- Build command：`npm run build`
- Build output directory：`dist`
- Node.js：使用 Cloudflare 默认的受支持版本即可

`functions/api/[[path]].js` 会把 `/api/*` 转给已经测试过的 Worker 路由，因此 Pages 不只是静态文件，报名接口也会保留。部署前在 Pages 项目设置里添加：

- D1 binding：变量名 `DB`，绑定 `njau-esports` 数据库
- Secret：`ADMIN_KEY`，用于管理员读取报名名单

首次配置 D1 时，在本地登录 Wrangler 后执行：

```powershell
cd backend-cf
npx wrangler d1 create njau-esports
npx wrangler d1 execute njau-esports --remote --file schema.sql
```

然后把 `database_id` 填入 `backend-cf/wrangler.toml`，并在 Pages 控制台配置同一个 D1 binding。之后按你列出的流程连接 GitHub 仓库，部署完成后在 Custom domains 添加 `njauesports.cn` 和 `www`。

## 独立 Workers 部署（备用）

如果以后不使用 Pages，也可以把前端和 `/api/*` 作为一个 Workers Static Assets 项目部署。Cloudflare Dashboard 的 Workers Builds 连接仓库时，使用 `backend-cf` 作为 Root directory，构建命令可留空或使用：

```text
npm ci && npm run build
```

部署 Worker 仍需要在 Cloudflare 中创建 D1，并把返回的数据库 ID 填到 `backend-cf/wrangler.toml` 的 `database_id`。首次部署前执行一次：

```powershell
cd backend-cf
npx wrangler d1 create njau-esports
npx wrangler secret put ADMIN_KEY
npx wrangler d1 execute njau-esports --remote --file schema.sql
npx wrangler deploy
```

`ADMIN_KEY` 只用于管理员读取报名名单，不能放入 GitHub。`wrangler.toml` 里的全零数据库 ID 是待替换占位符；没有替换前不要做生产部署。

## 本地检查

```powershell
cd backend-cf
npm ci
npm test
npm run check:deploy
```

`npm run build` 会生成根目录 `dist`，只包含发布所需的 HTML、CSS、JS 和资源；调试页、参考视频、备份、`.dev.vars` 和本地数据库目录不会进入 Git。
