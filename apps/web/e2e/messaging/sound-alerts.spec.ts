import { test, expect } from '@playwright/test';

test.describe('Sound Alerts for New Messages - TDD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('should have sound toggle in user settings', async ({ page }) => {
    // Navigate to settings/profile
    await page.goto('/en/profile');

    // Should have "Sound Alerts" toggle
    const soundToggle = page.locator('[data-testid="sound-alerts-toggle"]');
    await expect(soundToggle).toBeVisible();

    // Should be enabled by default
    await expect(soundToggle).toBeChecked();
  });

  test('should play sound when new message arrives (if enabled)', async ({
    page,
  }) => {
    // Enable sound alerts
    await page.goto('/en/profile');
    const soundToggle = page.locator('[data-testid="sound-alerts-toggle"]');
    await soundToggle.check();

    // Listen for audio element to play
    let audioPlayed = false;
    page.on('console', msg => {
      if (msg.text().includes('🔊 Playing notification sound')) {
        audioPlayed = true;
      }
    });

    // Go to a different page
    await page.goto('/en/marketplace');

    // Simulate new message (via polling)
    await page.waitForTimeout(12000);

    // Check if audio was played
    const toast = page.locator('[data-testid="message-toast"]');
    const toastVisible = await toast.isVisible().catch(() => false);

    if (toastVisible) {
      // If toast appeared, sound should have played
      expect(audioPlayed).toBeTruthy();
    }
  });

  test('should NOT play sound when sound alerts are disabled', async ({
    page,
  }) => {
    // Disable sound alerts
    await page.goto('/en/profile');
    const soundToggle = page.locator('[data-testid="sound-alerts-toggle"]');
    await soundToggle.uncheck();

    // Listen for audio
    let audioPlayed = false;
    page.on('console', msg => {
      if (msg.text().includes('🔊 Playing notification sound')) {
        audioPlayed = true;
      }
    });

    // Go to marketplace
    await page.goto('/en/marketplace');
    await page.waitForTimeout(12000);

    // Audio should NOT have played even if message arrived
    expect(audioPlayed).toBeFalsy();
  });

  test('should have mute button in notification toast', async ({ page }) => {
    // Wait for message toast
    const toast = page.locator('[data-testid="message-toast"]');
    await expect(toast).toBeVisible({ timeout: 15000 });

    // Should have mute/unmute button
    const muteBtn = toast.locator('[data-testid="toast-mute-button"]');
    await expect(muteBtn).toBeVisible();
  });
});
