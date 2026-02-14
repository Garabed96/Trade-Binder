import { test, expect } from '@playwright/test';

test.describe('Mark as Read from Toast - TDD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('should show Mark as Read button in message toast', async ({ page }) => {
    // Wait for a message toast to appear
    const toast = page.locator('[data-testid="message-toast"]');
    await expect(toast).toBeVisible({ timeout: 15000 });

    // Should have "Mark as Read" button
    const markReadBtn = toast.locator('button[data-testid="mark-as-read"]');
    await expect(markReadBtn).toBeVisible();
  });

  test('should mark message as read when button clicked', async ({ page }) => {
    // Get unread count before
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    const badgeBefore = notificationBell.locator('.absolute');
    const countBefore = await badgeBefore.textContent();

    // Toast appears with new message
    const toast = page.locator('[data-testid="message-toast"]');
    await expect(toast).toBeVisible({ timeout: 15000 });

    // Click "Mark as Read"
    const markReadBtn = toast.locator('button[data-testid="mark-as-read"]');
    await markReadBtn.click();

    // Toast should dismiss
    await expect(toast).not.toBeVisible();

    // Unread count should decrease
    await page.waitForTimeout(1000); // Wait for API call
    const badgeAfter = notificationBell.locator('.absolute');
    const countAfter = await badgeAfter.textContent();

    if (countBefore && countAfter) {
      expect(parseInt(countAfter)).toBeLessThan(parseInt(countBefore));
    }
  });

  test('should not navigate to messages when mark as read is clicked', async ({
    page,
  }) => {
    await page.goto('/en/marketplace');

    // Toast appears
    const toast = page.locator('[data-testid="message-toast"]');
    await expect(toast).toBeVisible({ timeout: 15000 });

    // Click "Mark as Read"
    const markReadBtn = toast.locator('button[data-testid="mark-as-read"]');
    await markReadBtn.click();

    // Should stay on marketplace page (not navigate)
    await expect(page).toHaveURL(/\/marketplace/);
  });
});
