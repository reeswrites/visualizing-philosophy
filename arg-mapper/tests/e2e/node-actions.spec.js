import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEED_NODES = [
  { id: "n0", parentId: null, type: "contention", text: "School uniforms should be mandatory" },
  { id: "n1", parentId: "n0", type: "premise", text: "Schools should reduce visible markers of inequality" },
  { id: "n1a", parentId: "n1", type: "premise", text: "Uniforms remove visible signals of family wealth", copremiseGroup: "cg-1" },
  { id: "n1b", parentId: "n1", type: "premise", text: "Schools are responsible for equal participation", copremiseGroup: "cg-1" },
  { id: "n2", parentId: "n0", type: "premise", text: "Attendance rates improve in schools with uniform policies" },
  { id: "n3", parentId: "n0", type: "premise", text: "Uniforms improve the learning environment" },
];

async function seedSession(page) {
  const userId = randomUUID();
  const { id } = await (await page.request.post('/api/sessions', { headers: { 'X-User-Id': userId } })).json();
  await page.request.put(`/api/sessions/${id}`, { data: { nodes: SEED_NODES, messages: [] } });
  await page.addInitScript(({ sessionId, userId }) => {
    localStorage.setItem('sessionId', String(sessionId));
    localStorage.setItem('userId', userId);
  }, { sessionId: id, userId });
  await page.goto('/');
  await page.locator('.node.contention').waitFor();
}

async function hoverNodeRect(page, nodeLocator) {
  await nodeLocator.locator('rect').hover();
}

async function openEditOverlay(page, nodeLocator) {
  await hoverNodeRect(page, nodeLocator);
  await expect(nodeLocator.locator('.node-action-edit')).toBeVisible();
  await nodeLocator.locator('.node-action-edit').click();
  await expect(page.locator('#node-edit-overlay')).toBeVisible();
}

async function openDeleteOverlay(page, nodeLocator) {
  await hoverNodeRect(page, nodeLocator);
  await expect(nodeLocator.locator('.node-action-delete')).toBeVisible();
  await nodeLocator.locator('.node-action-delete').click();
  await expect(page.locator('#node-delete-overlay')).toBeVisible();
}

// ── Edit overlay ──────────────────────────────────────────────────────────────

test.describe('Edit overlay', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
  });

  test('pencil icon appears on hover over a premise node', async ({ page }) => {
    const node = page.locator('.node.premise').first();
    await hoverNodeRect(page, node);
    await expect(node.locator('.node-action-edit')).toBeVisible();
  });

  test('pencil icon does NOT appear on contention node', async ({ page }) => {
    const contention = page.locator('.node.contention');
    await hoverNodeRect(page, contention);
    await expect(contention.locator('.node-action-edit')).toHaveCount(0);
  });

  test('clicking pencil opens overlay pre-filled with node text', async ({ page }) => {
    const node = page.locator('.node.premise').first();
    await openEditOverlay(page, node);
    const input = page.locator('#node-edit-input');
    await expect(input).not.toHaveValue('');
  });

  test('saving edit updates node text in graph', async ({ page }) => {
    const node = page.locator('.node.premise').first();
    await openEditOverlay(page, node);
    await page.locator('#node-edit-input').fill('My updated claim text');
    await page.locator('#node-edit-save').click();
    await expect(page.locator('#node-edit-overlay')).toBeHidden();
    // First premise node should now show the updated text
    await expect(node).toContainText('My updated claim text');
  });

  test('cancel closes overlay without saving', async ({ page }) => {
    const node = page.locator('.node.premise').first();
    const originalText = await node.locator('text').first().textContent();
    await openEditOverlay(page, node);
    await page.locator('#node-edit-input').fill('Changed text I will cancel');
    await page.locator('#node-edit-cancel').click();
    await expect(page.locator('#node-edit-overlay')).toBeHidden();
    await expect(node).not.toContainText('Changed text I will cancel');
  });

  test('Escape closes overlay without saving', async ({ page }) => {
    const node = page.locator('.node.premise').first();
    await openEditOverlay(page, node);
    await page.locator('#node-edit-input').fill('Escape test');
    await page.keyboard.press('Escape');
    await expect(page.locator('#node-edit-overlay')).toBeHidden();
    await expect(page.locator('.node.premise').filter({ hasText: 'Escape test' })).toHaveCount(0);
  });

  test('Enter in textarea saves the edit', async ({ page }) => {
    const node = page.locator('.node.premise').first();
    await openEditOverlay(page, node);
    await page.locator('#node-edit-input').fill('Saved via Enter key');
    await page.keyboard.press('Enter');
    await expect(page.locator('#node-edit-overlay')).toBeHidden();
    await expect(node).toContainText('Saved via Enter key');
  });

  test('saving with empty textarea closes overlay without changing node', async ({ page }) => {
    const node = page.locator('.node.premise').first();
    await openEditOverlay(page, node);
    const originalValue = await page.locator('#node-edit-input').inputValue();
    await page.locator('#node-edit-input').fill('');
    await page.locator('#node-edit-save').click();
    await expect(page.locator('#node-edit-overlay')).toBeHidden();
    // Verify text unchanged by reopening overlay — it should still show the original value
    await openEditOverlay(page, node);
    await expect(page.locator('#node-edit-input')).toHaveValue(originalValue);
  });
});

// ── Delete overlay ────────────────────────────────────────────────────────────

test.describe('Delete overlay', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
  });

  test('trash icon appears on hover over a premise node', async ({ page }) => {
    const node = page.locator('.node.premise').first();
    await hoverNodeRect(page, node);
    await expect(node.locator('.node-action-delete')).toBeVisible();
  });

  test('trash icon does NOT appear on contention node', async ({ page }) => {
    const contention = page.locator('.node.contention');
    await hoverNodeRect(page, contention);
    await expect(contention.locator('.node-action-delete')).toHaveCount(0);
  });

  test('clicking trash opens overlay with node text in description', async ({ page }) => {
    // Use n2 (second premise) — it has no children in map mode
    const node = page.locator('.node.premise').nth(1);
    await openDeleteOverlay(page, node);
    await expect(page.locator('#node-delete-desc')).not.toHaveText('');
  });

  test('deleting a leaf node removes only that node', async ({ page }) => {
    // n2 = "Attendance rates improve..." — no children in demo
    const node = page.locator('.node.premise').nth(1);
    const textToDelete = await node.locator('text').first().textContent();
    await openDeleteOverlay(page, node);
    await page.locator('#node-delete-confirm').click();
    await expect(page.locator('#node-delete-overlay')).toBeHidden();
    await expect(page.locator('.node.premise')).toHaveCount(2);
  });

  test('deleting a node with children shows cascade count', async ({ page }) => {
    // n1 = "Schools should reduce visible markers..." has children n1a, n1b
    const node = page.locator('.node.premise').first();
    await openDeleteOverlay(page, node);
    // Should mention the sub-claims count
    await expect(page.locator('#node-delete-desc')).toContainText('sub-claim');
  });

  test('cascade delete removes node and all descendants', async ({ page }) => {
    // n1 has 2 children (n1a, n1b) — total removal: n1 + 2 children = 3 nodes from the 7-node tree
    const node = page.locator('.node.premise').first();
    await openDeleteOverlay(page, node);
    await page.locator('#node-delete-confirm').click();
    await expect(page.locator('#node-delete-overlay')).toBeHidden();
    // Was 4 visible (map mode), now 3 (contention + n2 + n3)
    await expect(page.locator('.node')).toHaveCount(3);
  });

  test('cancel closes overlay without deleting', async ({ page }) => {
    const node = page.locator('.node.premise').first();
    await openDeleteOverlay(page, node);
    await page.locator('#node-delete-cancel').click();
    await expect(page.locator('#node-delete-overlay')).toBeHidden();
    await expect(page.locator('.node.premise')).toHaveCount(3);
  });

  test('deleting the focused node exits focus mode', async ({ page }) => {
    // Enter focus on n1 (first premise), then delete it from within
    await page.locator('.node.premise rect').first().click();
    await expect(page.locator('#focus-exit')).toBeVisible();

    // Now delete from focus mode — the focused node is n1 itself
    const node = page.locator('.node').first(); // first node in focus mode is the focused premise
    await openDeleteOverlay(page, node);
    await page.locator('#node-delete-confirm').click();

    // Should exit focus mode
    await expect(page.locator('#focus-exit')).toBeHidden();
  });
});
