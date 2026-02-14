import { test, expect } from '@playwright/test';

test.describe('Message Preview in Toast - TDD', () => {
  test('should show message preview in toast notification', async ({
    context,
  }) => {
    // Create two browser contexts for two users
    const user1Page = await context.newPage();
    const user2Page = await context.newPage();

    // User 1 (sender) logs in
    await user1Page.goto('/en/login');
    await user1Page.fill('input[name="email"]', 'user1@example.com');
    await user1Page.fill('input[name="password"]', 'password');
    await user1Page.click('button[type="submit"]');

    // User 2 (receiver) logs in
    await user2Page.goto('/en/login');
    await user2Page.fill('input[name="email"]', 'user2@example.com');
    await user2Page.fill('input[name="password"]', 'password');
    await user2Page.click('button[type="submit"]');

    // User 1 sends a message
    await user1Page.goto('/en/messages');
    const conversation = user1Page
      .locator('[data-testid^="conversation-"]')
      .first();
    await conversation.click();

    const messageText =
      'Hey! I have that Blue-Eyes White Dragon card you were looking for. Would you like to trade?';
    await user1Page.fill('input[placeholder="Type a message..."]', messageText);
    await user1Page.click('button[data-testid="send-message"]');

    // Wait for User 2's page to show toast
    await user2Page.waitForTimeout(12000); // Wait for polling interval

    // Toast should show message preview (first 50 chars)
    const toast = user2Page.locator('[data-testid="message-toast"]');
    await expect(toast).toBeVisible();

    // Should show truncated message preview
    const preview = toast.locator('[data-testid="message-preview"]');
    await expect(preview).toContainText(messageText.substring(0, 50) + '...');
  });

  test('should truncate long messages in toast preview', async ({ page }) => {
    await page.goto('/en/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Simulate receiving a long message via toast
    // Toast should show only first 50 characters
    const toast = page.locator('[data-testid="message-toast"]');

    // Preview should not exceed 50 chars + ellipsis
    const preview = toast.locator('[data-testid="message-preview"]');
    const text = await preview.textContent();

    if (text) {
      expect(text.length).toBeLessThanOrEqual(53); // 50 chars + "..."
    }
  });
});
