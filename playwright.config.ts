import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Fallback when bundled browser missing/incomplete (local dev). CI runs `playwright install`. */
function localChromiumExecutable() {
  if (process.env.CI) return undefined;
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const candidates = [
    path.join(base, 'chromium_headless_shell-1169/chrome-mac/headless_shell'),
    path.join(base, 'chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
    path.join(base, 'chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium')
  ];
  if (fs.existsSync(candidates[0])) return undefined;
  for (let i = 1; i < candidates.length; i += 1) {
    if (fs.existsSync(candidates[i])) return candidates[i];
  }
  return undefined;
}

const chromiumExecutable = localChromiumExecutable();

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  retries: 2,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    ...(chromiumExecutable
      ? { launchOptions: { executablePath: chromiumExecutable } }
      : {})
  },
  webServer: {
    command: 'node server.js',
    cwd: 'shadow-corpus/archive/demo-v0.2',
    env: {
      SHADOW_E2E: '1',
      SHADOW_JOBS_DIR: 'runs/jobs-e2e',
      PORT: '3000'
    },
    url: 'http://127.0.0.1:3000/api/health',
    reuseExistingServer: false,
    timeout: 30_000
  }
});
