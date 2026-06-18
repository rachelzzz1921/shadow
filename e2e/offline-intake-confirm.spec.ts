import { test, expect } from '@playwright/test';

/**
 * ECC H-A: 统一 generate 页在 API 不可用时，快速路径应本地合成并跳转 demo。
 */
test('quick path → offline synth → demo live', async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'offline' })
  );

  await page.goto('/generate.html');
  expect(await page.evaluate(() => !!window.ShadowGenerateBridge?.onIntakeComplete)).toBe(true);
  expect(await page.evaluate(() => !!window.ShadowCustomStory?.build)).toBe(true);

  await page.locator('#choiceInput').fill(
    '如果当年我没有选择复读，而是直接去了那所211大学读书'
  );
  await page.locator('#btnQuickPlay').click();
  await page.waitForURL(/demo\.html\?.*live=1/, { timeout: 30_000 });

  const live = await page.evaluate(() => {
    const raw = sessionStorage.getItem('shadow_live_session');
    const p = raw ? JSON.parse(raw) : null;
    return { years: p?.session?.years?.length ?? 0, synthetic: !!p?._custom_synthetic };
  });
  expect(live.years).toBe(7);
  expect(live.synthetic).toBe(true);
});

// 完整「确认步」与 quick path 共用 routeCustomToDemo / redirectToLocalDemo；
// 手动 spot-check：岔路口 → 标签 → 10 题 → 确认 → 开始书写七年。
