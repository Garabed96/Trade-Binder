import { test, expect } from '@playwright/test';

test.describe('Message Seller Button - TDD', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/en/login');
    await page.fill('input[name="email"]', 'buyer@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.goto('/en/marketplace');
  });

  test('should show Message Seller button in inquiry modal', async ({
    page,
  }) => {
    // Click on a listing to open SendInquiryModal
    const firstListing = page.locator('[data-testid^="listing-"]').first();
    await firstListing.click();

    // Modal should be visible
    const modal = page.locator('[data-testid="send-inquiry-modal"]');
    await expect(modal).toBeVisible();

    // Should have both "Send Inquiry" and "Message Seller" buttons
    const sendInquiryBtn = modal.locator('button:has-text("Send Inquiry")');
    const messageSellerBtn = modal.locator('button:has-text("Message Seller")');

    await expect(sendInquiryBtn).toBeVisible();
    await expect(messageSellerBtn).toBeVisible();
  });

  test('should open direct message modal when Message Seller is clicked', async ({
    page,
  }) => {
    // Open listing inquiry modal
    const firstListing = page.locator('[data-testid^="listing-"]').first();
    await firstListing.click();

    // Click "Message Seller" button
    const messageSellerBtn = page.locator('button:has-text("Message Seller")');
    await messageSellerBtn.click();

    // SendMessageModal should open
    const messageModal = page.locator('[data-testid="send-message-modal"]');
    await expect(messageModal).toBeVisible();

    // Should have textarea for message
    const textarea = messageModal.locator('textarea');
    await expect(textarea).toBeVisible();

    // Should have send button
    const sendBtn = messageModal.locator('button:has-text("Send Message")');
    await expect(sendBtn).toBeVisible();
  });

  test('should send direct message successfully', async ({ page }) => {
    // Open listing and message seller
    const firstListing = page.locator('[data-testid^="listing-"]').first();
    await firstListing.click();

    const messageSellerBtn = page.locator('button:has-text("Message Seller")');
    await messageSellerBtn.click();

    // Type message
    const messageModal = page.locator('[data-testid="send-message-modal"]');
    const textarea = messageModal.locator('textarea');
    await textarea.fill('Hi, is this card still available?');

    // Send message
    const sendBtn = messageModal.locator('button:has-text("Send Message")');
    await sendBtn.click();

    // Should navigate to messages page
    await expect(page).toHaveURL(/\/messages/);

    // Should show success toast
    const toast = page.locator('text=Message sent!');
    await expect(toast).toBeVisible();
  });
});
