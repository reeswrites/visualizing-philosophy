import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function submit(page, text) {
  await page.locator('#dialogue-input').fill(text);
  await page.locator('#dialogue-submit').click();
}

async function waitForGuideMessage(page, substring) {
  await expect(page.locator('#dialogue-messages .msg.ai').last()).toContainText(substring, { timeout: 5000 });
}

// ── Page load ─────────────────────────────────────────────────────────────────

test.describe('Page load', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows initial Guide message asking for the contention', async ({ page }) => {
    await expect(page.locator('.msg.ai .label').first()).toHaveText('Guide');
    await expect(page.locator('.msg.ai').first()).toContainText("What is the argument you're trying to make");
  });

  test('fresh session starts with empty graph', async ({ page }) => {
    await expect(page.locator('.node')).toHaveCount(0);
  });

  test('no graph overlays visible on load', async ({ page }) => {
    await expect(page.locator('#node-edit-overlay')).toBeHidden();
    await expect(page.locator('#node-delete-overlay')).toBeHidden();
  });

  test('submit button and input are enabled', async ({ page }) => {
    await expect(page.locator('#dialogue-submit')).toBeEnabled();
    await expect(page.locator('#dialogue-input')).toBeEnabled();
  });
});

// ── Full dialogue flow ────────────────────────────────────────────────────────

test.describe('Full dialogue: contention → premise → objection → rebuttal → done', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('submitting adds contention node', async ({ page }) => {
    await submit(page, 'Homework should be banned');
    await expect(page.locator('.node.contention')).toHaveCount(1);
    // SVG wraps text across multiple <text> elements — use regex to match across line breaks
    await expect(page.locator('.node.contention')).toContainText(/Homework.*banned/s);
    await expect(page.locator('.node.premise')).toHaveCount(0);
  });

  test('contention step → prompts for premise', async ({ page }) => {
    await submit(page, 'Sleep is essential for teenagers');
    await waitForGuideMessage(page, 'Why do you believe');
    await waitForGuideMessage(page, 'Sleep is essential for teenagers');
  });

  test('premise step → prompts for co-premise', async ({ page }) => {
    await submit(page, 'Cats make better pets than dogs');
    await submit(page, 'Cats are self-sufficient');
    await waitForGuideMessage(page, 'Does that reason need another claim');
  });

  test('answering no to co-premise → prompts for objection', async ({ page }) => {
    await submit(page, 'Four-day weeks improve productivity');
    await submit(page, 'Workers are more focused');
    await submit(page, 'no, it stands alone');
    await waitForGuideMessage(page, "What would someone who disagrees say");
  });

  test('objection step → prompts for rebuttal', async ({ page }) => {
    await submit(page, 'Exercise daily');
    await submit(page, 'It boosts energy');
    await submit(page, 'no');
    await submit(page, 'Consistency is hard to maintain');
    await waitForGuideMessage(page, 'How would you respond');
    // Objection exists in data (visible in focus mode, not map mode — map shows contention+premises only)
    await page.locator('.node.premise rect').first().click();
    await expect(page.locator('.node.objection')).toHaveCount(1);
  });

  test('rebuttal step → prompts for more premises', async ({ page }) => {
    await submit(page, 'Reading improves vocabulary');
    await submit(page, 'It exposes you to more words');
    await submit(page, 'no');
    await submit(page, 'Most people lack time');
    await submit(page, 'Short sessions still compound over months');
    await waitForGuideMessage(page, 'Any other independent reason');
    // Rebuttal is visible in focus mode on the premise
    await page.locator('.node.premise rect').first().click();
    await expect(page.locator('.node.rebuttal')).toHaveCount(1);
  });

  test('"done" ends the flow and disables input', async ({ page }) => {
    await submit(page, 'Naps are underrated');
    await submit(page, 'A 20-minute nap restores alertness');
    await submit(page, 'no');
    await submit(page, 'skip');
    await submit(page, 'done');
    await waitForGuideMessage(page, 'Click any premise');
    await expect(page.locator('#dialogue-submit')).toBeDisabled();
    await expect(page.locator('#dialogue-input')).toBeDisabled();
  });

  test('skipping objection goes straight to more-premises', async ({ page }) => {
    await submit(page, 'Music education matters');
    await submit(page, 'It trains pattern recognition');
    await submit(page, 'no');
    await submit(page, 'skip');
    await waitForGuideMessage(page, 'Any other independent reason');
    // No objection node
    await expect(page.locator('.node.objection')).toHaveCount(0);
  });
});

// ── Co-premise flow ───────────────────────────────────────────────────────────

test.describe('Co-premise flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('yes to co-premise → prompts for second claim', async ({ page }) => {
    await submit(page, 'Cities should ban cars');
    await submit(page, 'Air quality would improve');
    await submit(page, 'yes, together they make the case');
    await waitForGuideMessage(page, 'What is the other claim');
  });

  test('co-premise pair creates two premise nodes', async ({ page }) => {
    await submit(page, 'Remote work is better');
    await submit(page, 'Commutes waste time');
    await submit(page, 'yes');
    await submit(page, 'That time could be used productively');
    await expect(page.locator('.node.premise')).toHaveCount(2);
  });
});

// ── Focus mode ────────────────────────────────────────────────────────────────

const FOCUS_NODES = [
  { id: "n0", parentId: null, type: "contention", text: "School uniforms should be mandatory" },
  { id: "n1", parentId: "n0", type: "premise", text: "Schools should reduce visible markers of inequality" },
  { id: "n1a", parentId: "n1", type: "premise", text: "Uniforms remove visible signals of family wealth", copremiseGroup: "cg-1" },
  { id: "n1b", parentId: "n1", type: "premise", text: "Schools are responsible for equal participation", copremiseGroup: "cg-1" },
  { id: "n2", parentId: "n0", type: "premise", text: "Attendance rates improve in schools with uniform policies" },
  { id: "n3", parentId: "n0", type: "premise", text: "Uniforms improve the learning environment" },
];

test.describe('Focus mode', () => {
  test.beforeEach(async ({ page }) => {
    const userId = randomUUID();
    const { id } = await (await page.request.post('/api/sessions', { headers: { 'X-User-Id': userId } })).json();
    await page.request.put(`/api/sessions/${id}`, { data: { nodes: FOCUS_NODES, messages: [] } });
    await page.addInitScript(({ sessionId, userId }) => {
      localStorage.setItem('sessionId', String(sessionId));
      localStorage.setItem('userId', userId);
    }, { sessionId: id, userId });
    await page.goto('/');
    await page.locator('.node.contention').waitFor();
  });

  test('clicking a premise node enters focus mode and shows back button', async ({ page }) => {
    await page.locator('.node.premise rect').first().click();
    await expect(page.locator('#focus-exit')).toBeVisible();
  });

  test('focus mode shows the premise and its subtree', async ({ page }) => {
    await page.locator('.node.premise rect').first().click();
    // Focused node (n1) + its two copremise children (n1a, n1b)
    await expect(page.locator('.node')).toHaveCount(3);
  });

  test('back button exits focus mode and restores map', async ({ page }) => {
    await page.locator('.node.premise rect').first().click();
    await page.locator('#focus-exit').click();
    await expect(page.locator('#focus-exit')).toBeHidden();
    // Map mode: contention + 3 direct premises
    await expect(page.locator('.node')).toHaveCount(4);
  });

  test('Escape key exits focus mode', async ({ page }) => {
    await page.locator('.node.premise rect').first().click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#focus-exit')).toBeHidden();
  });

  test('clicking a premise adds a divider and new guide message', async ({ page }) => {
    await page.locator('.node.premise rect').first().click();
    await expect(page.locator('.msg-divider').last()).toBeVisible();
    await expect(page.locator('#dialogue-messages')).toContainText('Why do you believe');
  });
});
