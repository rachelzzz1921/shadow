# GitHub Pages 团队看板

静态看板站点，供五人团队共享浏览。

## 在线地址

启用 Pages 后为：

```text
https://<你的用户名>.github.io/<仓库名>/
```

例如仓库 `chenzhiwei/shadow` → `https://chenzhiwei.github.io/shadow/`

## 本地预览

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

# 刷新 markdown 看板 + 网站
npm run board:publish

git add docs shadow-corpus/06-task-progress
git commit -m "Update board"
git push
```

## 自动部署（可选）

已含 `.github/workflows/pages.yml`：push 到 `main` 且改了 registry 时自动重建 `docs/` 并部署 Pages。

需在仓库 Settings → Actions 允许 workflow 写 Pages。

## 文件

| 文件 | 说明 |
|------|------|
| `docs/index.html` | 看板页面（自动生成，勿手改） |
| `docs/board-data.json` | 任务数据（自动生成） |
| `site.config.json` | 仓库名、标题配置 |
