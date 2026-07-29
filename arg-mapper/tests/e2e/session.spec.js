import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

async function submit(page, text) {
  await page.locator('#dialogue-input').fill(text);
  await page.locator('#dialogue-submit').click();
}

async function waitForGuide(page, substring) {
  await expect(page.locator('#dialogue-messages .msg.ai').last()).toContainText(substring, { timeout: 5000 });
}

async function waitForSave(page) {
  // scheduleSave debounces 800ms — wait for the PUT to complete
  await page.waitForResponse(r => r.url().includes('/api/sessions/') && r.request().method() === 'PUT', { timeout: 3000 });
}

// ── Session persistence ───────────────────────────────────────────────────────

test.describe('Session persistence', () => {
  test('saves contention node to DB after first submit', async ({ page }) => {
    await page.goto('/');
    await submit(page, 'Exercise is essential for health');
    await waitForGuide(page, 'Why do you believe');
    await waitForSave(page);

    const sessionId = await page.evaluate(() => localStorage.getItem('sessionId'));
    const res = await page.request.get(`/api/sessions/${sessionId}`);
    const session = await res.json();

    expect(session.nodes).toHaveLength(1);
    expect(session.nodes[0].type).toBe('contention');
    expect(session.nodes[0].text).toBe('Exercise is essential for health');
  });

  test('saves chat messages (user + ai roles) to DB', async ({ page }) => {
    await page.goto('/');
    await submit(page, 'Reading daily builds vocabulary');
    await waitForGuide(page, 'Why do you believe');
    await waitForSave(page);

    const sessionId = await page.evaluate(() => localStorage.getItem('sessionId'));
    const res = await page.request.get(`/api/sessions/${sessionId}`);
    const { messages } = await res.json();

    expect(messages.some(m => m.role === 'user' && m.text === 'Reading daily builds vocabulary')).toBe(true);
    expect(messages.some(m => m.role === 'ai')).toBe(true);
  });

  test('restores nodes on page reload', async ({ page }) => {
    await page.goto('/');
    await submit(page, 'Sleep is crucial for memory');
    await waitForGuide(page, 'Why do you believe');
    await waitForSave(page);

    await page.goto('/');

    await expect(page.locator('.node.contention')).toContainText(/Sleep.*memory/s);
    // demo premises are NOT shown
    await expect(page.locator('.node.premise')).toHaveCount(0);
  });

  test('restores chat messages on page reload', async ({ page }) => {
    await page.goto('/');
    await submit(page, 'Naps boost afternoon alertness');
    await waitForGuide(page, 'Why do you believe');
    await waitForSave(page);

    await page.goto('/');

    await expect(page.locator('#dialogue-messages')).toContainText('Naps boost afternoon alertness');
    await expect(page.locator('#dialogue-messages')).toContainText('Why do you believe');
  });

  test('input is enabled after restoring a saved session', async ({ page }) => {
    await page.goto('/');
    await submit(page, 'Cold showers improve mood');
    await waitForGuide(page, 'Why do you believe');
    await waitForSave(page);

    await page.goto('/');

    await expect(page.locator('#dialogue-input')).toBeEnabled();
    await expect(page.locator('#dialogue-submit')).toBeEnabled();
  });
});

// ── New argument button ───────────────────────────────────────────────────────

test.describe('New argument button', () => {
  test('creates a new session with a different ID', async ({ page }) => {
    await page.goto('/');
    await submit(page, 'Music sharpens concentration');
    await waitForGuide(page, 'Why do you believe');
    await waitForSave(page);
    const oldId = await page.evaluate(() => localStorage.getItem('sessionId'));

    await page.locator('#new-argument-btn').click();

    const newId = await page.evaluate(() => localStorage.getItem('sessionId'));
    expect(newId).not.toBe(oldId);
  });

  test('shows empty graph and initial prompt after click', async ({ page }) => {
    await page.goto('/');
    await submit(page, 'Walking clears the mind');
    await waitForGuide(page, 'Why do you believe');
    await waitForSave(page);

    await page.locator('#new-argument-btn').click();

    await expect(page.locator('.node')).toHaveCount(0);
    await expect(page.locator('#dialogue-messages')).toContainText("What is the argument you're trying to make");
  });

  test('does not save demo nodes to the new session', async ({ page }) => {
    await page.goto('/');
    await page.locator('#new-argument-btn').click();
    // Give any pending save time to fire (it shouldn't)
    await page.waitForTimeout(1200);

    const sessionId = await page.evaluate(() => localStorage.getItem('sessionId'));
    const res = await page.request.get(`/api/sessions/${sessionId}`);
    const { nodes } = await res.json();
    expect(nodes).toHaveLength(0);
  });
});

// ── SVG layer order (z-index) ─────────────────────────────────────────────────

const LAYER_NODES = [
  { id: "n0", parentId: null, type: "contention", text: "School uniforms should be mandatory" },
  { id: "n1", parentId: "n0", type: "premise", text: "Schools should reduce visible markers of inequality" },
  { id: "n2", parentId: "n0", type: "premise", text: "Attendance rates improve in schools with uniform policies" },
];

async function seedLayerSession(page) {
  const userId = randomUUID();
  const { id } = await (await page.request.post('/api/sessions', { headers: { 'X-User-Id': userId } })).json();
  await page.request.put(`/api/sessions/${id}`, { data: { nodes: LAYER_NODES, messages: [] } });
  await page.addInitScript(({ sessionId, userId }) => {
    localStorage.setItem('sessionId', String(sessionId));
    localStorage.setItem('userId', userId);
  }, { sessionId: id, userId });
  await page.goto('/');
  await page.locator('.node.contention').waitFor();
}

test.describe('SVG layer order', () => {
  function getLayerOrder(page) {
    return page.evaluate(() => {
      const root = document.querySelector('.graph-root');
      const tags = Array.from(root.children).map(el => el.getAttribute('class'));
      return { linksIdx: tags.indexOf('links-layer'), nodesIdx: tags.indexOf('nodes-layer') };
    });
  }

  test('links-layer precedes nodes-layer on initial load', async ({ page }) => {
    await page.goto('/');
    const { linksIdx, nodesIdx } = await getLayerOrder(page);
    expect(linksIdx).toBeGreaterThanOrEqual(0);
    expect(linksIdx).toBeLessThan(nodesIdx);
  });

  test('links-layer stays before nodes-layer after entering focus mode', async ({ page }) => {
    await seedLayerSession(page);
    await page.locator('.node.premise rect').first().click();
    const { linksIdx, nodesIdx } = await getLayerOrder(page);
    expect(linksIdx).toBeLessThan(nodesIdx);
  });

  test('links-layer stays before nodes-layer after exiting focus mode', async ({ page }) => {
    await seedLayerSession(page);
    await page.locator('.node.premise rect').first().click();
    await page.keyboard.press('Escape');
    const { linksIdx, nodesIdx } = await getLayerOrder(page);
    expect(linksIdx).toBeLessThan(nodesIdx);
  });
});
