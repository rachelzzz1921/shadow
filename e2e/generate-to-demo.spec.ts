import { test, expect } from '@playwright/test';

async function createE2eJob(request: import('@playwright/test').APIRequestContext) {
  const res = await request.post('/api/story/jobs', {
    data: {
      profile: {
        choice: '如果当年我没有选择复读',
        age: 18,
        keywords: ['往前走']
      },
      persona_card: {
        name: '阿岚',
        core_traits: ['要强'],
        soft_spots: ['期待'],
        decision_tendency: '继续走',
        growth_seed: '够了'
      },
      generation_mode: 'fast'
    }
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.job_id).toBeTruthy();
  return body.job_id as string;
}

async function waitForJobStatus(
  request: import('@playwright/test').APIRequestContext,
  jobId: string,
  status: string
) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const res = await request.get(`/api/story/jobs/${encodeURIComponent(jobId)}`);
    expect(res.ok()).toBeTruthy();
    const job = await res.json();
    if (job.status === status) return job;
    if (job.status === 'failed') throw new Error(job.error || 'job failed');
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`timeout waiting for ${status}`);
}

test.describe.configure({ mode: 'serial' });

test('generate → intervention → demo live', async ({ page, request }) => {
  const health = await request.get('/api/health');
  expect(health.ok()).toBeTruthy();
  expect((await health.json()).e2e).toBe(true);

  const jobId = await createE2eJob(request);
  await page.goto(`/generate.html?job_id=${encodeURIComponent(jobId)}&autoresume=1`);

  await expect(page.locator('#gen-progress')).toBeVisible({ timeout: 15_000 });
  const modal = page.locator('#intervention-modal');
  await expect(modal).toBeVisible({ timeout: 60_000 });
  await page.locator('#intervention-options button').first().click();

  await expect.poll(async () => {
    const res = await request.get(`/api/story/jobs/${encodeURIComponent(jobId)}`);
    return (await res.json()).status;
  }, { timeout: 90_000 }).toBe('done');

  await page.waitForURL(/demo\.html\?.*live=1/, { timeout: 30_000, waitUntil: 'domcontentloaded' });

  const startBtn = page.locator('#btn-start');
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click();
  }
  await expect(page.getByRole('button', { name: /第 1 年/ }).first()).toBeVisible({ timeout: 15_000 });
});

test('awaiting_intervention survives page reload', async ({ page, request }) => {
  const jobId = await createE2eJob(request);
  await waitForJobStatus(request, jobId, 'awaiting_intervention');

  await page.goto(`/generate.html?job_id=${encodeURIComponent(jobId)}&autoresume=1`);
  const modal = page.locator('#intervention-modal');
  await expect(modal).toBeVisible({ timeout: 30_000 });

  await page.reload();
  await expect(modal).toBeVisible({ timeout: 30_000 });
  await page.locator('#intervention-options button').first().click();

  await expect.poll(async () => {
    const res = await request.get(`/api/story/jobs/${encodeURIComponent(jobId)}`);
    return (await res.json()).status;
  }, { timeout: 90_000 }).toBe('done');

  await page.waitForURL(/demo\.html\?.*live=1/, { timeout: 30_000, waitUntil: 'domcontentloaded' });
});
