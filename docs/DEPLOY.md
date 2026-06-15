# GitHub Pages 部署速查

**完整架构、Intake 映射、页面地图 → [`SITE.md`](./SITE.md)**

## 一键发布

```bash
npm run board:publish
git add docs shadow-corpus .cursor/rules
git commit -m "…"
git push origin main
```

## 常用 URL

基址见 `shadow-corpus/06-task-progress/site.config.json` → `githubPagesBase`。

| 页面 | 路径 |
|------|------|
| 对外首页 | `/` |
| Pitch | `/pitch.html` |
| 采集 + API | `/generate.html` |
| 叙事 Demo | `/demo.html` |
| Visual | `/demo-phaser.html` |
| 团队看板 | `/board.html` |

## 本地

```bash
npm run demo:local    # :3000，含 API
npm run demo:preview  # :5199，仅静态
```
