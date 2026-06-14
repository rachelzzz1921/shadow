#!/usr/bin/env node
/**
 * Import 像素小人素材 zip → docs/visual-characters + catalog JSON
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const RAW = path.join(ROOT, 'shadow-corpus/visual/assets/raw/shadow-characters-v1');
const OUT_IMG = path.join(ROOT, 'docs/visual-characters');
const OUT_PUB = path.join(ROOT, 'shadow-corpus/archive/demo-v0.2/public/assets/characters');
const OUT_DATA = path.join(ROOT, 'shadow-corpus/archive/demo-v0.2/public/data/shadow-characters-v1.json');
const OUT_DOCS_DATA = path.join(ROOT, 'docs/data/shadow-characters-v1.json');

/** @type {import('../../../docs/data/shadow-characters-v1.types').CharacterEntry[]} */
const CATALOG = [
  { asset_id: 'PX-SHC-001', file: 'shc-01.png', label_zh: '棕发粉裙女生', gender_presentation: 'female', age_vibe: 'young_adult', hair: 'brown_bob', outfit: 'pink_dress', mood_fit: ['quiet', 'warm', 'melancholy'], domain_affinity: ['family', 'academic', 'love'], intake_tag_hints: ['安静', '要强', '习惯藏话', '父母期待'], archetype_fit: ['the_pleaser', 'the_endurer', 'any'] },
  { asset_id: 'PX-SHC-002', file: 'shc-02.png', label_zh: '深肤绿衫男生', gender_presentation: 'male', age_vibe: 'young_adult', hair: 'afro_dark', outfit: 'casual_green', mood_fit: ['warm', 'energetic', 'quiet'], domain_affinity: ['friendship', 'self_growth', 'career'], intake_tag_hints: ['外向', '务实', '行动', '朋友'], archetype_fit: ['the_endurer', 'any'] },
  { asset_id: 'PX-SHC-003', file: 'shc-03.png', label_zh: '深蓝外套男生', gender_presentation: 'male', age_vibe: 'young_adult', hair: 'short_dark', outfit: 'jacket_casual', mood_fit: ['cool', 'quiet'], domain_affinity: ['career', 'academic'], intake_tag_hints: ['理性', '克制', '事业'], archetype_fit: ['the_detached', 'the_doubter'] },
  { asset_id: 'PX-SHC-004', file: 'shc-04.png', label_zh: '格子衫男生', gender_presentation: 'male', age_vibe: 'youth', hair: 'messy_brown', outfit: 'plaid_shirt', mood_fit: ['energetic', 'warm'], domain_affinity: ['friendship', 'academic'], intake_tag_hints: ['友情', '校园', '热闹'], archetype_fit: ['any'] },
  { asset_id: 'PX-SHC-005', file: 'shc-05.png', label_zh: '马尾运动女生', gender_presentation: 'female', age_vibe: 'youth', hair: 'ponytail', outfit: 'sport_casual', mood_fit: ['energetic', 'warm'], domain_affinity: ['friendship', 'self_growth'], intake_tag_hints: ['活力', '运动', '外向'], archetype_fit: ['the_endurer', 'any'] },
  { asset_id: 'PX-SHC-006', file: 'shc-06.png', label_zh: '青发绿衫男生', gender_presentation: 'male', age_vibe: 'youth', hair: 'teal_messy', outfit: 'green_emblem_shirt', mood_fit: ['quiet', 'cool'], domain_affinity: ['academic', 'self_growth'], intake_tag_hints: ['内向', '学业', '敏感'], archetype_fit: ['the_doubter', 'the_detached'] },
  { asset_id: 'PX-SHC-007', file: 'shc-07.png', label_zh: '短发工装女生', gender_presentation: 'female', age_vibe: 'young_adult', hair: 'short_black', outfit: 'work_casual', mood_fit: ['cool', 'quiet'], domain_affinity: ['career', 'self_growth'], intake_tag_hints: ['独立', '事业', '行动'], archetype_fit: ['the_endurer', 'the_detached'] },
  { asset_id: 'PX-SHC-008', file: 'shc-08.png', label_zh: '红衫休闲男生', gender_presentation: 'male', age_vibe: 'young_adult', hair: 'brown_short', outfit: 'red_casual', mood_fit: ['warm', 'energetic'], domain_affinity: ['love', 'friendship'], intake_tag_hints: ['热情', '爱情', '主动'], archetype_fit: ['any'] },
  { asset_id: 'PX-SHC-009', file: 'shc-09.png', label_zh: '长发文艺女生', gender_presentation: 'female', age_vibe: 'young_adult', hair: 'long_dark', outfit: 'literary_casual', mood_fit: ['melancholy', 'quiet'], domain_affinity: ['love', 'self_growth', 'academic'], intake_tag_hints: ['文艺', '敏感', '内省', '爱情'], archetype_fit: ['the_doubter', 'the_pleaser'] },
  { asset_id: 'PX-SHC-010', file: 'shc-10.png', label_zh: '深肤街头男生', gender_presentation: 'male', age_vibe: 'youth', hair: 'fade_dark', outfit: 'street_casual', mood_fit: ['cool', 'energetic'], domain_affinity: ['friendship', 'career'], intake_tag_hints: ['酷', '城市', '朋友'], archetype_fit: ['the_detached', 'any'] },
  { asset_id: 'PX-SHC-011', file: 'shc-11.png', label_zh: '黄衫短发女生', gender_presentation: 'female', age_vibe: 'youth', hair: 'black_bob', outfit: 'yellow_tee', mood_fit: ['warm', 'quiet'], domain_affinity: ['academic', 'family'], intake_tag_hints: ['学生', '青春', '要强'], archetype_fit: ['the_endurer', 'the_pleaser'] },
  { asset_id: 'PX-SHC-012', file: 'shc-12.png', label_zh: '米色针织女生', gender_presentation: 'female', age_vibe: 'young_adult', hair: 'brown_long', outfit: 'cozy_knit', mood_fit: ['warm', 'melancholy'], domain_affinity: ['family', 'love'], intake_tag_hints: ['温柔', '亲情', '家'], archetype_fit: ['the_pleaser', 'any'] },
  { asset_id: 'PX-SHC-013', file: 'shc-13.png', label_zh: '眼镜书卷男生', gender_presentation: 'male', age_vibe: 'young_adult', hair: 'neat_dark', outfit: 'student_casual', mood_fit: ['quiet', 'cool'], domain_affinity: ['academic', 'career'], intake_tag_hints: ['学业', '考研', '复读', '理性'], archetype_fit: ['the_endurer', 'the_doubter'] },
  { asset_id: 'PX-SHC-014', file: 'shc-14.png', label_zh: '连帽衫女生', gender_presentation: 'female', age_vibe: 'youth', hair: 'hood_hidden', outfit: 'hoodie', mood_fit: ['cool', 'melancholy'], domain_affinity: ['self_growth', 'friendship'], intake_tag_hints: ['退缩', '孤独', '失眠'], archetype_fit: ['the_detached', 'the_doubter'] },
  { asset_id: 'PX-SHC-015', file: 'shc-15.png', label_zh: '白衬衫男生', gender_presentation: 'male', age_vibe: 'young_adult', hair: 'short_neat', outfit: 'white_shirt', mood_fit: ['quiet', 'warm'], domain_affinity: ['career', 'academic'], intake_tag_hints: ['正式', '面试', '事业'], archetype_fit: ['the_endurer', 'the_pleaser'] },
  { asset_id: 'PX-SHC-016', file: 'shc-16.png', label_zh: '深肤橙衫男生', gender_presentation: 'male', age_vibe: 'young_adult', hair: 'afro_dark', outfit: 'orange_sweater', mood_fit: ['warm', 'quiet'], domain_affinity: ['family', 'self_growth'], intake_tag_hints: ['质朴', '老家', '劳动'], archetype_fit: ['the_endurer', 'any'] },
  { asset_id: 'PX-SHC-017', file: 'shc-17.png', label_zh: '蓝裙深肤女生', gender_presentation: 'female', age_vibe: 'young_adult', hair: 'curly_dark', outfit: 'blue_dress', mood_fit: ['warm', 'quiet'], domain_affinity: ['family', 'love'], intake_tag_hints: ['温柔', '包容', '亲情'], archetype_fit: ['the_pleaser', 'any'] },
  { asset_id: 'PX-SHC-018', file: 'shc-18.png', label_zh: '灰帽中性角色', gender_presentation: 'neutral', age_vibe: 'young_adult', hair: 'cap_grey', outfit: 'neutral_casual', mood_fit: ['cool', 'quiet'], domain_affinity: ['self_growth', 'career'], intake_tag_hints: ['不指定', '中性', '观望'], archetype_fit: ['any'] },
  { asset_id: 'PX-SHC-019', file: 'shc-19.png', label_zh: '深肤卷发女生', gender_presentation: 'female', age_vibe: 'young_adult', hair: 'curly_volume', outfit: 'casual_warm', mood_fit: ['energetic', 'warm'], domain_affinity: ['friendship', 'love'], intake_tag_hints: ['自信', '外向', '爱情'], archetype_fit: ['any'] },
  { asset_id: 'PX-SHC-020', file: 'shc-20.png', label_zh: '白发蓝裙女生', gender_presentation: 'female', age_vibe: 'mature', hair: 'white_fluffy', outfit: 'blue_peterpan', mood_fit: ['quiet', 'melancholy', 'warm'], domain_affinity: ['family', 'self_growth'], intake_tag_hints: ['怀旧', '童年', '够了', '平静'], archetype_fit: ['the_pleaser', 'the_doubter', 'any'] }
];

function listPngs(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.png') && !f.startsWith('._'))
    .sort((a, b) => a.localeCompare(b, 'zh'));
}

const srcFiles = listPngs(RAW);
if (srcFiles.length !== CATALOG.length) {
  console.warn(`Warning: ${srcFiles.length} PNGs vs ${CATALOG.length} catalog entries`);
}

fs.mkdirSync(OUT_IMG, { recursive: true });
fs.mkdirSync(OUT_PUB, { recursive: true });
fs.mkdirSync(path.dirname(OUT_DATA), { recursive: true });
fs.mkdirSync(path.dirname(OUT_DOCS_DATA), { recursive: true });

const manifest = {
  pack_id: 'shadow-characters-v1',
  status: 'production',
  source: '用户提供的像素小人素材(3).zip',
  license: 'project_internal',
  protagonist_default: 'PX-SHC-001',
  image_base: '/visual-characters/',
  characters: CATALOG.map((c, i) => {
    const src = srcFiles[i];
    if (src) {
      const destName = c.file;
      fs.copyFileSync(path.join(RAW, src), path.join(OUT_IMG, destName));
      fs.copyFileSync(path.join(RAW, src), path.join(OUT_PUB, destName));
    }
    return {
      ...c,
      demo_path: `visual-characters/${c.file}`,
      local_raw: `shadow-corpus/visual/assets/raw/shadow-characters-v1/${src || c.file}`
    };
  })
};

const json = JSON.stringify(manifest, null, 2) + '\n';
fs.writeFileSync(OUT_DATA, json);
fs.writeFileSync(OUT_DOCS_DATA, json);

console.log(`Imported ${Math.min(srcFiles.length, CATALOG.length)} characters`);
console.log(`  images: ${OUT_IMG}`);
console.log(`  data:   ${OUT_DATA}`);
