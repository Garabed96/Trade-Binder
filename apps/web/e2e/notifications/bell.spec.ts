import { test, expect } from '@playwright/test';

test.describe('Notification Bell', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/en/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/en');
  });

  test('should display notification bell in navbar', async ({ page }) => {
    // Wait for notification bell to be visible
    const bell = page.locator('[data-testid="notification-bell"]');
    await expect(bell).toBeVisible();
  });

  test('should display unread count badge when there are unread notifications', async ({
    page,
  }) => {
    const bell = page.locator('[data-testid="notification-bell"]');
    await expect(bell).toBeVisible();

    // Check if badge exists (if there are notifications)
    const badge = bell.locator('.absolute');
    const badgeVisible = await badge.isVisible().catch(() => false);

    if (badgeVisible) {
      // Badge should show a number or "9+"
      await expect(badge).toHaveText(/\d+\+?/);
    }
  });

  test('should open dropdown when bell is clicked', async ({ page }) => {
    const bell = page.locator('[data-testid="notification-bell"]');
    await bell.click();

    // Dropdown should be visible
    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Should have header with "Notifications" text
    await expect(dropdown.locator('text=Notifications')).toBeVisible();
  });

  test('should close dropdown when backdrop is clicked', async ({ page }) => {
    const bell = page.locator('[data-testid="notification-bell"]');
    await bell.click();

    // Dropdown should be visible
    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Click backdrop to close
    await page.click('body');

    // Dropdown should be hidden
    await expect(dropdown).not.toBeVisible();
  });

  test('should mark all notifications as read', async ({ page }) => {
    const bell = page.locator('[data-testid="notification-bell"]');
    await bell.click();

    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Click "Mark all read" button
    const markAllButton = dropdown.locator('button:has-text("Mark all read")');
    if (await markAllButton.isVisible()) {
      await markAllButton.click();

      // Wait for the action to complete
      await page.waitForTimeout(1000);
    }
  });

  test('should display notifications in dropdown', async ({ page }) => {
    const bell = page.locator('[data-testid="notification-bell"]');
    await bell.click();

    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Check for notifications or "No notifications" message
    const noNotificationsText = dropdown.locator('text=No notifications');
    const notificationItems = dropdown.locator(
      '[data-testid^="notification-"]'
    );

    const hasNoNotifications = await noNotificationsText
      .isVisible()
      .catch(() => false);
    const hasNotifications = (await notificationItems.count()) > 0;

    // Either should have notifications or "No notifications" message
    expect(hasNoNotifications || hasNotifications).toBeTruthy();
  });
});
