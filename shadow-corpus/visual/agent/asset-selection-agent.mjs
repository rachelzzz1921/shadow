/**
 * LLM Asset Selection Agent — DeepSeek / demo llm-runtime
 * Output: assetPlan + per-year imageGenerationHint
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const DEMO_ROOT = path.resolve(__dirname, '../../archive/demo-v0.2');

const imageGenerationHintSchema = z.object({
  needed: z.boolean(),
  targetRole: z.enum(['none', 'background', 'character', 'prop', 'composite']),
  replacingAssetId: z.string(),
  promptZh: z.string(),
  promptEn: z.string(),
  negativePrompt: z.string(),
  styleTags: z.array(z.string()),
  aspectRatio: z.string(),
  sizeHint: z.string()
});

export const assetPlanSchema = z.object({
  assetPlan: z.object({
    characterProfile: z.object({
      gender: z.string(),
      appearanceTags: z.array(z.string()),
      selectedCharacterId: z.string(),
      fallbackUsed: z.boolean(),
      reason: z.string()
    }),
    years: z.array(
      z.object({
        yearIndex: z.number(),
        calendarYear: z.number(),
        scene: z.string(),
        backgroundAssetId: z.string(),
        characterAssetId: z.string(),
        fxAssetIds: z.array(z.string()),
        propAssetIds: z.array(z.string()),
        uiAssetIds: z.array(z.string()),
        mood: z.string(),
        confidence: z.number(),
        fallbackUsed: z.boolean(),
        reason: z.string(),
        imageGenerationHint: imageGenerationHintSchema
      })
    )
  })
});

function loadDemoEnv() {
  const loadEnvPath = path.join(DEMO_ROOT, 'lib/load-env.js');
  const { loadDemoEnv: load } = require(loadEnvPath);
  load();
}

function readPromptDoc() {
  const docPath = path.join(__dirname, 'prompts/asset-selection-prompt-engineering.md');
  const text = fs.readFileSync(docPath, 'utf8');
  const systemEnd = text.indexOf('## 二、输入数据结构说明');
  const userStart = text.indexOf('## 七、User Prompt Template');
  const system = systemEnd > 0 ? text.slice(0, systemEnd).replace(/^#[^\n]+\n\n/, '').trim() : text;
  const userTemplate =
    userStart > 0
      ? text.slice(userStart).replace(/^## 七、User Prompt Template\n\n/, '').trim()
      : '';
  return { system, userTemplate };
}

function fillUserTemplate(template, payload) {
  return template
    .replace('{{USER_INPUT_JSON}}', JSON.stringify(payload.userInput, null, 2))
    .replace('{{SCENE_ROUTE_JSON}}', JSON.stringify(payload.sceneRoute, null, 2))
    .replace('{{SHADOW_DATA_JSON}}', JSON.stringify(payload.shadowData, null, 2))
    .replace('{{CANDIDATE_ASSETS_JSON}}', JSON.stringify(payload.candidateAssets, null, 2))
    .replace('{{CANDIDATE_CHARACTERS_JSON}}', JSON.stringify(payload.candidateCharacters, null, 2));
}

/**
 * @param {object} payload — same shape as asset-selection-prompt-engineering.md §二
 * @param {{ runtime?: object, temperature?: number }} [opts]
 */
export async function generateAssetPlan(payload, opts = {}) {
  loadDemoEnv();
  const { createLiveRuntime } = require(path.join(DEMO_ROOT, 'lib/llm-runtime.js'));
  const runtime = opts.runtime || createLiveRuntime();
  const { system, userTemplate } = readPromptDoc();
  const prompt = fillUserTemplate(userTemplate, payload);

  const object = await runtime.generateStructured({
    schema: assetPlanSchema,
    system,
    prompt,
    temperature: opts.temperature ?? 0.4
  });

  return { assetPlan: object.assetPlan, provider: runtime.provider, model: runtime.model };
}

async function main() {
  const fixturePath = process.argv[2];
  if (!fixturePath) {
    console.error('Usage: node asset-selection-agent.mjs <input.json>');
    process.exit(1);
  }
  const payload = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const result = await generateAssetPlan(payload);
  console.log(JSON.stringify(result, null, 2));
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
