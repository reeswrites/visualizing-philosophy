import { test, expect } from '@playwright/test';

async function submit(page, text) {
  await page.locator('#dialogue-input').fill(text);
  await page.locator('#dialogue-submit').click();
}

async function messageCount(page) {
  return page.locator('#dialogue-messages .msg').count();
}

// ── Empty / whitespace input ───────────────────────────────────────────────────

test.describe('Empty and whitespace input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('clicking submit with empty input adds no new messages', async ({ page }) => {
    const before = await messageCount(page);
    await page.locator('#dialogue-submit').click();
    expect(await messageCount(page)).toBe(before);
  });

  test('submitting whitespace-only adds no new messages', async ({ page }) => {
    const before = await messageCount(page);
    await submit(page, '   ');
    expect(await messageCount(page)).toBe(before);
  });

  test('empty submit does not change state (contention prompt still shown)', async ({ page }) => {
    await page.locator('#dialogue-submit').click();
    await expect(page.locator('.msg.ai').first()).toContainText("What is the argument you're trying to make");
  });

  test('whitespace submit does not advance past contention state', async ({ page }) => {
    await submit(page, '   ');
    // If state had advanced we'd see "Why do you believe" — it shouldn't
    await expect(page.locator('#dialogue-messages')).not.toContainText('Why do you believe');
  });
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

test.describe('Keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Enter submits the dialogue input', async ({ page }) => {
    await page.locator('#dialogue-input').fill('Climate change is real');
    await page.keyboard.press('Enter');
    await expect(page.locator('#dialogue-messages')).toContainText('Climate change is real');
    await expect(page.locator('.node.contention')).toContainText('Climate change is real');
  });

  test('Shift+Enter inserts a newline instead of submitting', async ({ page }) => {
    const input = page.locator('#dialogue-input');
    await input.fill('Line one');
    await input.press('Shift+Enter');
    await input.type('Line two');
    // No submission — contention prompt still shown, no new AI message yet
    await expect(page.locator('#dialogue-messages')).not.toContainText('Line one');
  });
});

// ── Co-premise negation handling (regression for false-positive bug) ──────────

test.describe('Co-premise ask: negation detection', () => {
  async function reachCopremiseAsk(page) {
    await submit(page, 'Tax cuts grow the economy');
    await submit(page, 'Businesses invest more when taxed less');
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('"no" alone skips co-premise', async ({ page }) => {
    await reachCopremiseAsk(page);
    await submit(page, 'no');
    await expect(page.locator('#dialogue-messages')).toContainText("What would someone who disagrees say");
  });

  test('"no, it does not need another claim" skips co-premise despite containing "need" and "another"', async ({ page }) => {
    await reachCopremiseAsk(page);
    await submit(page, 'no, it does not need another claim');
    await expect(page.locator('#dialogue-messages')).toContainText("What would someone who disagrees say");
  });

  test('"no it stands alone" skips co-premise', async ({ page }) => {
    await reachCopremiseAsk(page);
    await submit(page, 'no it stands alone');
    await expect(page.locator('#dialogue-messages')).toContainText("What would someone who disagrees say");
  });

  test('"yes" accepts co-premise', async ({ page }) => {
    await reachCopremiseAsk(page);
    await submit(page, 'yes');
    await expect(page.locator('#dialogue-messages')).toContainText("What is the other claim");
  });

  test('"yes, they both need to be true" accepts co-premise', async ({ page }) => {
    await reachCopremiseAsk(page);
    await submit(page, 'yes, they both need to be true');
    await expect(page.locator('#dialogue-messages')).toContainText("What is the other claim");
  });

  test('"together they make the argument" accepts co-premise', async ({ page }) => {
    await reachCopremiseAsk(page);
    await submit(page, 'together they make the argument');
    await expect(page.locator('#dialogue-messages')).toContainText("What is the other claim");
  });

  test('"independently valid" skips co-premise (contains "independent")', async ({ page }) => {
    await reachCopremiseAsk(page);
    await submit(page, 'it is independently valid');
    await expect(page.locator('#dialogue-messages')).toContainText("What would someone who disagrees say");
  });
});

// ── Done / skip exact matching ────────────────────────────────────────────────

test.describe('Done and skip commands', () => {
  async function reachMorePremises(page) {
    await submit(page, 'Meditation reduces stress');
    await submit(page, 'It lowers cortisol levels');
    await submit(page, 'no');
    await submit(page, 'skip');
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('"done" ends the flow', async ({ page }) => {
    await reachMorePremises(page);
    await submit(page, 'done');
    await expect(page.locator('#dialogue-messages')).toContainText('Click any premise');
    await expect(page.locator('#dialogue-submit')).toBeDisabled();
  });

  test('"DONE" (uppercase) also ends the flow', async ({ page }) => {
    await reachMorePremises(page);
    await submit(page, 'DONE');
    await expect(page.locator('#dialogue-messages')).toContainText('Click any premise');
  });

  test('typing another premise in more_premises state adds a second premise', async ({ page }) => {
    await reachMorePremises(page);
    await submit(page, 'It also improves sleep quality');
    await expect(page.locator('#dialogue-messages')).toContainText('Does that reason need another claim');
    await expect(page.locator('.node.premise')).toHaveCount(2);
  });
});

// ── AI toggle ─────────────────────────────────────────────────────────────────

test.describe('AI mode toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('toggle label changes to "AI Guide (beta)" when enabled', async ({ page }) => {
    await expect(page.locator('.toggle-label')).toHaveText('AI Guide');
    await page.locator('.ai-toggle-wrap').click();
    await expect(page.locator('.toggle-label')).toHaveText('AI Guide (beta)');
  });

  test('toggle label reverts when disabled', async ({ page }) => {
    await page.locator('.ai-toggle-wrap').click(); // enable
    await page.locator('.ai-toggle-wrap').click(); // disable
    await expect(page.locator('.toggle-label')).toHaveText('AI Guide');
  });

  test('AI mode toggle track becomes blue when enabled', async ({ page }) => {
    await page.locator('.ai-toggle-wrap').click();
    await expect(page.locator('.toggle-track')).toHaveCSS('background-color', 'rgb(37, 99, 235)');
  });

  test('dialogue still works normally when AI mode is on (stub falls through)', async ({ page }) => {
    await page.locator('.ai-toggle-wrap').click();
    await submit(page, 'Space exploration is worth the cost');
    await expect(page.locator('.node.contention')).toContainText('Space exploration');
    await expect(page.locator('#dialogue-messages')).toContainText('Why do you believe');
  });
});
