# v2 叙事 → Golden JSON 同步说明（V-008 占位）

**阻塞**：[`narrative-draft-v2.md`](narrative-draft-v2.md) P2 终稿 + G-N1 签字。

## 同步字段

| Golden 路径 | v2 来源 |
|-------------|---------|
| `years[n].visual_anchor` | 每章 `visual_anchor` |
| `years[n].props` | `props[]` |
| `years[n].narrative` | 正文（**不改** intervention 结构） |
| `shadow_dialogue` | 仅 P2 改 |

## 命令（终稿后）

```bash
# 侧车：visual/stories/fuxduxian/v2-fields.json
npm run sync:golden-v2              # dry-run
npm run sync:golden-v2:apply        # G-N1 签字后

npm run test:golden
npm test
```

## 双份副本

- 源：`fixtures/golden-stories/复读线.json`
- Demo：`04-dev-testing/golden-stories/复读线.json`（若存在则同步）

## 队友

- [ ] P2 锁定 v2 文本  
- [ ] P3 实现 `sync-golden-from-v2.mjs`（可选脚本）  
- [ ] P4 eval 回归
