# Shadow

工作区根目录。**所有 Harness 统筹内容在 [`shadow-corpus/`](shadow-corpus/)**。

## 入口

| 文件 | 说明 |
|------|------|
| [`shadow-corpus/README.md`](shadow-corpus/README.md) | 统筹包总览 |
| [`shadow-corpus/MANIFEST.md`](shadow-corpus/MANIFEST.md) | 全目录索引 |
| [`shadow-corpus/AGENTS.md`](shadow-corpus/AGENTS.md) | Agent 阅读顺序 |

## Skill 同步

```bash
chmod +x shadow-corpus/skills/sync-cursor-links.sh
./shadow-corpus/skills/sync-cursor-links.sh
```

## 归档 Demo（可选）

```bash
npm install --prefix shadow-corpus/archive/demo-v0.2
npm run dev --prefix shadow-corpus/archive/demo-v0.2
```

## 其他

- 通用 Harness 研究：[`agent-harnass/`](agent-harnass/)
- 像素素材、xlsx 等与本 Harness 包无关，保留在根目录
