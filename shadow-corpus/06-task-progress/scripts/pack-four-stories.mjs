#!/usr/bin/env node
/**
 * pack-four-stories.mjs — 四套剧本及相关文档打包为 zip
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const CORPUS = path.join(REPO, 'shadow-corpus');
const DEMO_HTML = path.join(CORPUS, 'archive/demo-v0.2/public/index.html');
const OUT_DIR = path.join(REPO, 'shadow-four-stories-pack');
const ZIP_PATH = path.join(REPO, 'shadow-four-stories-pack.zip');

const STORY_META = [
  { id: '01-fuxduxian', file: '01-复读线-阿岚.json', name: '复读线', shadow: '阿岚', storyId: 'fuxduxian' },
  { id: '02-game-design', file: '02-游戏策划线-林屿.json', name: '游戏策划线', shadow: '林屿', storyId: 'linyu' },
  { id: '03-physician', file: '03-住院医师线-沈念.json', name: '住院医师线', shadow: '沈念', storyId: 'shennian' },
  { id: '04-wuhan-stay', file: '04-武汉留下线-周原.json', name: '武汉留下线', shadow: '周原', storyId: 'zhouyuan' },
];

function extractFromDemo() {
  const html = fs.readFileSync(DEMO_HTML, 'utf8');
  const inputsMatch = html.match(/const DEMO_INPUTS = (\[[\s\S]*?\n    \]);/);
  const storiesMatch = html.match(/const LOCAL_STORIES = (\[[\s\S]*?\n    \]);/);
  if (!inputsMatch || !storiesMatch) throw new Error('Could not parse DEMO_INPUTS or LOCAL_STORIES from index.html');
  // eslint-disable-next-line no-new-func
  const demoInputs = new Function(`return ${inputsMatch[1]}`)();
  // eslint-disable-next-line no-new-func
  const localStories = new Function(`return ${storiesMatch[1]}`)();
  if (localStories.length !== 4) throw new Error(`Expected 4 stories, got ${localStories.length}`);
  return { demoInputs, localStories };
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyOptional(src, dest) {
  if (fs.existsSync(src)) copyFile(src, dest);
}

function writeJson(dest, data) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(data, null, 2) + '\n');
}

function buildReadme() {
  return `# Shadow 四套剧本资料包

生成时间：${new Date().toISOString().slice(0, 10)}

## 目录

\`\`\`
shadow-four-stories-pack/
├── README.md                 # 本文件
├── MANIFEST.json             # 机器可读清单
├── profiles.json             # 四套用户 profile 输入
├── stories/                  # 从 demo 提取的四套完整剧本 JSON
├── golden/                   # 复读线 golden（验收源）
├── visual-fuxduxian/         # 复读线视觉 / 叙事前置文档
├── docs/                     # 叙事协议、eval、契约
├── skills/                   # story-authoring / story-review
└── demo-source/              # 原始 demo 关键文件引用
\`\`\`

## 四套剧本

| # | 文件 | 影子 | 线名 |
|---|------|------|------|
| 0 | stories/01-复读线-阿岚.json | 阿岚 | 复读线 |
| 1 | stories/02-游戏策划线-林屿.json | 林屿 | 游戏策划线 |
| 2 | stories/03-住院医师线-沈念.json | 沈念 | 住院医师线 |
| 3 | stories/04-武汉留下线-周原.json | 周原 | 武汉留下线 |

## 验收（复读线）

\`\`\`bash
# 在 shadow 仓库根目录
npm test --prefix shadow-corpus/archive/demo-v0.2
\`\`\`

## 来源仓库路径

- 剧本容器：\`shadow-corpus/archive/demo-v0.2/public/index.html\`
- Golden：\`shadow-corpus/fixtures/golden-stories/\`
- Visual：\`shadow-corpus/visual/stories/fuxduxian/\`
`;
}

function main() {
  const { demoInputs, localStories } = extractFromDemo();

  if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // profiles + stories
  writeJson(path.join(OUT_DIR, 'profiles.json'), demoInputs.map((p, i) => ({
    index: i,
    ...STORY_META[i],
    profile: p,
  })));

  const storiesDir = path.join(OUT_DIR, 'stories');
  localStories.forEach((story, i) => {
    const meta = STORY_META[i];
    writeJson(path.join(storiesDir, meta.file), {
      _meta: {
        index: i,
        story_id: meta.storyId,
        line_name: meta.name,
        shadow_name: meta.shadow,
        profile: demoInputs[i],
        source: 'shadow-corpus/archive/demo-v0.2/public/index.html → LOCAL_STORIES[' + i + ']',
        extracted_at: new Date().toISOString().slice(0, 10),
      },
      ...story,
    });
  });

  // golden
  const goldenDir = path.join(OUT_DIR, 'golden');
  copyFile(path.join(CORPUS, 'fixtures/golden-stories/复读线.json'), path.join(goldenDir, '复读线.json'));
  copyFile(path.join(CORPUS, 'fixtures/golden-stories/复读线.md'), path.join(goldenDir, '复读线.md'));
  copyFile(path.join(CORPUS, 'fixtures/golden-stories/INDEX.md'), path.join(goldenDir, 'INDEX.md'));
  copyOptional(path.join(CORPUS, '04-dev-testing/golden-stories/复读线.json'), path.join(goldenDir, '复读线.eval-test.json'));

  // visual fuxduxian
  const visDir = path.join(OUT_DIR, 'visual-fuxduxian');
  copyFile(path.join(CORPUS, 'visual/stories/fuxduxian/scene-briefs.md'), path.join(visDir, 'scene-briefs.md'));
  copyFile(path.join(CORPUS, 'visual/stories/fuxduxian/narrative-gaps.md'), path.join(visDir, 'narrative-gaps.md'));
  copyFile(path.join(CORPUS, 'visual/README.md'), path.join(visDir, 'visual-README.md'));
  copyFile(path.join(CORPUS, 'visual/01-pipeline.md'), path.join(visDir, '01-pipeline.md'));
  copyFile(path.join(CORPUS, 'visual/04-ux-flow.md'), path.join(visDir, '04-ux-flow.md'));
  copyFile(path.join(CORPUS, 'visual/02-asset-registry-spec.md'), path.join(visDir, '02-asset-registry-spec.md'));
  copyFile(path.join(CORPUS, 'visual/03-layout-schema.json'), path.join(visDir, '03-layout-schema.json'));
  copyOptional(path.join(CORPUS, 'visual/registry/assets.csv'), path.join(visDir, 'assets.csv'));

  // docs
  const docsDir = path.join(OUT_DIR, 'docs');
  copyFile(path.join(CORPUS, '03-coding/01-narrative-prompt-protocol.md'), path.join(docsDir, '01-narrative-prompt-protocol.md'));
  copyFile(path.join(CORPUS, '04-dev-testing/01-narrative-eval-rubric.md'), path.join(docsDir, '01-narrative-eval-rubric.md'));
  copyFile(path.join(CORPUS, '01-requirements/02-intervention-requirements.md'), path.join(docsDir, '02-intervention-requirements.md'));
  copyFile(path.join(CORPUS, '02-technical-design/02-api-and-contract.md'), path.join(docsDir, '02-api-and-contract.md'));
  copyFile(path.join(CORPUS, 'archive/demo-v0.2/lib/contract.example.json'), path.join(docsDir, 'contract.example.json'));

  // skills
  const skillsDir = path.join(OUT_DIR, 'skills');
  copyFile(path.join(CORPUS, 'skills/shadow/story-authoring/SKILL.md'), path.join(skillsDir, 'story-authoring.md'));
  copyFile(path.join(CORPUS, 'skills/shadow/story-review/SKILL.md'), path.join(skillsDir, 'story-review.md'));

  // demo source (evaluator + schemas + html reference)
  const demoDir = path.join(OUT_DIR, 'demo-source');
  copyFile(DEMO_HTML, path.join(demoDir, 'index.html'));
  copyFile(path.join(CORPUS, 'archive/demo-v0.2/lib/evaluator.js'), path.join(demoDir, 'evaluator.js'));
  copyFile(path.join(CORPUS, 'archive/demo-v0.2/lib/schemas.js'), path.join(demoDir, 'schemas.js'));
  copyFile(path.join(CORPUS, 'archive/demo-v0.2/README.md'), path.join(demoDir, 'demo-README.md'));

  // manifest
  writeJson(path.join(OUT_DIR, 'MANIFEST.json'), {
    version: 1,
    generated_at: new Date().toISOString(),
    stories: STORY_META.map((m, i) => ({
      ...m,
      profile: demoInputs[i],
      story_file: `stories/${m.file}`,
      shadow_name: localStories[i].shadow_name,
      premise: localStories[i].premise,
    })),
    golden: ['golden/复读线.json', 'golden/复读线.md'],
    note: 'Only 复读线 has standalone golden + eval; others extracted from demo LOCAL_STORIES',
  });

  fs.writeFileSync(path.join(OUT_DIR, 'README.md'), buildReadme());

  if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
  execSync(`cd "${REPO}" && zip -r "shadow-four-stories-pack.zip" "shadow-four-stories-pack" -x "*.DS_Store"`, {
    stdio: 'inherit',
  });

  const size = fs.statSync(ZIP_PATH).size;
  console.log(`\n✓ Pack → ${OUT_DIR}/`);
  console.log(`✓ Zip  → ${ZIP_PATH} (${(size / 1024).toFixed(1)} KB)`);
}

main();
