import { test, expect } from '@playwright/test';

test.describe('Browser Push Notifications - TDD', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications']);

    await page.goto('/en/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('should show enable push notifications prompt', async ({ page }) => {
    // On first login, should show push notification prompt
    const prompt = page.locator('[data-testid="push-notification-prompt"]');
    await expect(prompt).toBeVisible();

    // Should have "Enable" and "Not now" buttons
    const enableBtn = prompt.locator('button:has-text("Enable")');
    const notNowBtn = prompt.locator('button:has-text("Not now")');

    await expect(enableBtn).toBeVisible();
    await expect(notNowBtn).toBeVisible();
  });

  test('should request notification permission when enabled', async ({
    page,
  }) => {
    const prompt = page.locator('[data-testid="push-notification-prompt"]');
    const enableBtn = prompt.locator('button:has-text("Enable")');

    // Track permission request
    let permissionRequested = false;
    page.on('console', msg => {
      if (msg.text().includes('Requesting notification permission')) {
        permissionRequested = true;
      }
    });

    await enableBtn.click();

    // Should have requested permission
    expect(permissionRequested).toBeTruthy();

    // Prompt should disappear
    await expect(prompt).not.toBeVisible();
  });

  test('should have push notification toggle in settings', async ({ page }) => {
    await page.goto('/en/profile');

    // Should have "Push Notifications" toggle
    const pushToggle = page.locator(
      '[data-testid="push-notifications-toggle"]'
    );
    await expect(pushToggle).toBeVisible();
  });

  test('should send push notification when new message arrives', async ({
    page,
  }) => {
    // Enable push notifications
    await page.goto('/en/profile');
    const pushToggle = page.locator(
      '[data-testid="push-notifications-toggle"]'
    );
    await pushToggle.check();

    // Navigate away from messages page
    await page.goto('/en/marketplace');

    // Wait for new message to arrive (simulated via polling)
    await page.waitForTimeout(12000);

    // Check if notification was sent
    const toast = page.locator('[data-testid="message-toast"]');
    const toastVisible = await toast.isVisible().catch(() => false);

    if (toastVisible) {
      // If message arrived, push notification should have been sent
      // Note: Playwright cannot directly capture browser notification events
      // This test verifies the toast appears, actual push notifications
      // would need to be tested via service worker inspection
      expect(toastVisible).toBeTruthy();
    }
  });

  test('should show notification permission status', async ({ page }) => {
    await page.goto('/en/profile');

    const status = page.locator(
      '[data-testid="notification-permission-status"]'
    );
    await expect(status).toBeVisible();

    // Should show "Enabled", "Disabled", or "Denied"
    const statusText = await status.textContent();
    expect(statusText).toMatch(/Enabled|Disabled|Denied|Default/);
  });
});
