# 多 Run 对比模板

任务：**T-024** · P1 评估增强

## 用途

同一 profile / golden 结构，对比不同 model 或 prompt 版本的 eval 与叙事质量。

## 对比表

| run_id | 日期 | model | prompt_tag | eval errors | eval warns | score | pivotal 数 | regret 质量 (1–5) | 备注 |
|--------|------|-------|------------|-------------|------------|-------|------------|-------------------|------|
| | | | | | | | | | |

## 首条样例（待填）

| 字段 | 值 |
|------|-----|
| baseline | `fixtures/golden-stories/复读线.json` |
| live run | `archive/demo-v0.2/runs/*.json` |

## 命令

```bash
# eval golden
cd shadow-corpus/archive/demo-v0.2
node -e "const s=require('../../fixtures/golden-stories/复读线.json'); const e=require('./lib/evaluator').evaluateStory(s); console.log(JSON.stringify({ok:e.ok,score:e.score,errors:e.errors,warnings:e.warnings},null,2))"

# 列最近 trace
ls -lt runs/*.json 2>/dev/null | head -5
```

## 结论字段

- **保留 model**：eval 0 error 且 narrative 抽检 ≥4/5
- **回退 prompt**：error 或 intervention.thread fail
- **继续实验**：warn only → 见 [`03-eval-warn-decision-tree.md`](../05-qa-testing/03-eval-warn-decision-tree.md)
