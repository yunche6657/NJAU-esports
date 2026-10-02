# NJAU 电竞社

南京农业大学学生电竞社团网站，包含八个游戏分部、活动时间轴、荣誉展示、互动音效和招新报名。

## 目录

- `frontend/`：静态网站页面、样式、脚本和发布资源
- `backend-cf/`：Cloudflare Worker + D1 API
- `scripts/build.mjs`：生成 Cloudflare Static Assets 发布目录
- `functions/api/[[path]].js`：Cloudflare Pages Functions API 入口
- `docs/DEPLOY.md`：GitHub 与 Cloudflare 部署步骤
- `docs/PRELAUNCH-AUDIT.md`：双端检查与上线前记录

## 本地验证

```powershell
npm run build
npm test
```

Pages 部署参数为：Root directory `.`、Build command `npm run build`、Output directory `dist`。

生产部署前请先替换 `backend-cf/wrangler.toml` 中的 D1 `database_id`，并在 Cloudflare Secret 中设置 `ADMIN_KEY`。本地 `.dev.vars`、构建目录和调试素材不会进入仓库。
