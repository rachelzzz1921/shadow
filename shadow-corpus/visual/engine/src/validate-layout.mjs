/**
 * Validate Shadow visual layout JSON (draft schema subset).
 */
import fs from 'node:fs';
import path from 'node:path';

const REQUIRED = ['story_id', 'year', 'scene_type', 'background', 'layers'];

export function validateLayout(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') {
    return ['root must be object'];
  }
  for (const key of REQUIRED) {
    if (!(key in obj)) errors.push(`missing ${key}`);
  }
  if (obj.background && !obj.background.asset_id) {
    errors.push('background.asset_id required');
  }
  if (!Array.isArray(obj.layers) || !obj.layers.length) {
    errors.push('layers must be non-empty array');
  } else {
    obj.layers.forEach((layer, i) => {
      if (!layer.asset_id) errors.push(`layers[${i}].asset_id required`);
      if (!layer.role) errors.push(`layers[${i}].role required`);
    });
  }
  return errors;
}

function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Usage: validate-layout.mjs <file.layout.json> ...');
    process.exit(1);
  }
  let failed = 0;
  for (const file of files) {
    const raw = fs.readFileSync(path.resolve(file), 'utf8');
    const data = JSON.parse(raw);
    const errors = validateLayout(data);
    if (errors.length) {
      failed += 1;
      console.error(`FAIL ${file}:`, errors.join('; '));
    } else {
      console.log(`OK ${file} (year ${data.year}, ${data.scene_type})`);
    }
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('validate-layout.mjs')) {
  main();
}
