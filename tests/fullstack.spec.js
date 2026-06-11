const { test, expect } = require('@playwright/test');

test.describe('Tutorify Fullstack Verification', () => {
  test.beforeEach(async ({ page }) => {
    // We expect the server to be running on port 3000
    await page.goto('http://localhost:3000/index.html');
  });

  test('Navbar auth state and login flow', async ({ page }) => {
    await expect(page.locator('#auth-link')).toContainText('Login');

    await page.click('text=Login');
    await page.fill('#loginEmail', 'pw@example.com');
    await page.fill('#loginPassword', 'password123');
    await page.selectOption('#loginRole', 'user');

    // Handle the alert
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Login")');

    await page.waitForURL('**/index.html');
    await expect(page.locator('#auth-link')).toContainText('Logout');
  });

  test('Dynamic course loading', async ({ page }) => {
    await page.goto('http://localhost:3000/courses.html');
    await expect(page.locator('.course')).toHaveCount(17);
    await expect(page.locator('.course h4').first()).not.toBeEmpty();
  });

  test('Contact form submission', async ({ page }) => {
    await page.goto('http://localhost:3000/contact.html');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'This is a test message from Playwright');
    await page.click('button[type="submit"]');

    await expect(page.locator('#form-status')).toBeVisible();
    await expect(page.locator('#form-status')).toContainText('sent successfully');
  });

  test('Admin dashboard stats', async ({ page }) => {
    // First login as admin
    await page.goto('http://localhost:3000/login.html');
    await page.fill('#loginEmail', 'admin@example.com');
    await page.fill('#loginPassword', 'password123');
    await page.selectOption('#loginRole', 'admin');

    // Handle the alert
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Login")');

    await page.waitForURL('**/dashboard.html');

    // Check if stats are loaded
    await expect(page.locator('.card .numbers').first()).not.toContainText('1,504'); // Static value in HTML was 1,504
    await expect(page.locator('.card .numbers').nth(1)).toContainText('17'); // 17 courses
  });
});
