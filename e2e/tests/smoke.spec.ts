import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('SignalGrid');
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/login"]');
    await expect(page.locator('h1')).toContainText('Login');
  });

  test('can navigate to feed page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/feed"]');
    await expect(page.locator('h1')).toContainText('Live Feed');
  });
});
