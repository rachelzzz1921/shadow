# GitHub Pages 团队看板

静态看板站点，供五人团队共享浏览。

## 在线地址

启用 Pages 后为：

```text
https://<你的用户名>.github.io/<仓库名>/
```

当前仓库配置见 `site.config.json` → `githubPagesBase`。

### 复读线 Demo（fuxduxian-v1）

| 页面 | GitHub Pages URL |
|------|------------------|
| 团队看板 | `https://rachelzzz1921.github.io/shadow/` |
| **Demo 入口（Hub）** | `https://rachelzzz1921.github.io/shadow/demo-hub.html` |
| 三层 Intake | `https://rachelzzz1921.github.io/shadow/intake.html` |
| 叙事 Demo（Mock / Live 浏览） | `https://rachelzzz1921.github.io/shadow/demo.html` |
| Live 全链生成（需 API） | `https://rachelzzz1921.github.io/shadow/demo-live.html` |
| Phaser layout v1 | `https://rachelzzz1921.github.io/shadow/demo-phaser.html` |
| Phaser legacy 占位 | `https://rachelzzz1921.github.io/shadow/demo-phaser.html?legacy=1` |

推送前请打包视觉素材：

```bash
npm run board:publish   # 含 build:visual-demo → docs/demo-layouts-v1.json
```

例如仓库 `chenzhiwei/shadow` → `https://chenzhiwei.github.io/shadow/`

## 本地预览

```bash
# 静态 only（5199）— Intake 用规则版 Persona，无 LLM
npm run demo:preview
# → http://localhost:5199/demo.html · http://localhost:5199/intake.html

# Live API + 静态（3000）— Intake 走阶跃星辰 LLM
# 先在 shadow-corpus/archive/demo-v0.2/.env 配置 STEPFUN_API_KEY
npm run demo:live
# → http://localhost:3000/intake.html · POST /api/persona/analyze
```

| 页面 | 静态 (5199) | Live (3000) |
|------|-------------|-------------|
| 叙事 Demo | `/demo.html` | `/demo.html` |
| 三层 Intake | `/intake.html`（规则 Persona） | `/intake.html`（**真实 LLM**） |
| Persona API | — | `POST /api/persona/analyze` |

```bash
# 1. 填写 GitHub 仓库（用于跳转链接）
# 编辑 shadow-corpus/06-task-progress/site.config.json
#   "githubRepo": "你的用户名/shadow"

# 2. 同步 markdown 看板 + 构建网站
npm run board:publish

# 3. 本地打开
npx serve docs
# 访问 http://localhost:3000
```

## 首次部署 GitHub Pages

1. **初始化 git 并推送到 GitHub**（若尚未）：

```bash
cd /path/to/shadow
git init
git add .
git commit -m "Add Shadow corpus and team board"
git branch -M main
git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

2. **填写** `shadow-corpus/06-task-progress/site.config.json` 中的 `githubRepo`

3. **重新构建并推送**：

```bash
npm run board:publish
git add docs shadow-corpus
git commit -m "Update team board site"
git push
```

4. **GitHub 仓库 → Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** · Folder: **/docs**
   - Save

5. 等 1–2 分钟，打开 Pages URL

## 日常更新看板

```bash
# 改 tasks/registry.json 或用 CLI
npm run tasks -- done T-007

# 刷新 markdown 看板 + 网站（含 visual demo 打包）
npm run board:publish

git add docs shadow-corpus/06-task-progress
git commit -m "Update board"
git push origin main
```

**规则：** 改 `docs/`、Visual draft 或预览相关文件后，同一会话内 push 到 `main`，让 GitHub Pages 及时更新。详见 `.cursor/rules/github-pages-deploy.mdc`。

## 自动部署（可选）

已含 `.github/workflows/pages.yml`：push 到 `main` 且改了 registry 时自动重建 `docs/` 并部署 Pages。

需在仓库 Settings → Actions 允许 workflow 写 Pages。

## 文件

| 文件 | 说明 |
|------|------|
| `docs/index.html` | 看板页面（自动生成，勿手改） |
| `docs/board-data.json` | 任务数据（自动生成） |
| `site.config.json` | 仓库名、标题配置 |
