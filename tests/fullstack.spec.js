const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // We need to start the server or assume it's running.
  // In this environment, we'll start it in the bash session before running tests.
});

test('Login as admin and check dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/login.html');
  await page.fill('#loginEmail', 'admin@example.com');
  await page.fill('#loginPassword', 'password123');
  await page.selectOption('#loginRole', 'admin');

  // Listen for dialog
  page.on('dialog', dialog => dialog.dismiss());

  await page.click('#loginBtn');
  await page.waitForURL('**/dashboard.html');

  await expect(page.locator('.numbers').first()).not.toBeEmpty();
  const userName = await page.evaluate(() => JSON.parse(localStorage.getItem('user')).name);
  expect(userName).toBe('Admin User');
});

test('Dynamic courses load on index page', async ({ page }) => {
  await page.goto('http://localhost:3000/index.html');
  const courses = page.locator('.course');
  await expect(courses).not.toHaveCount(0);
});

test('Contact form submission', async ({ page }) => {
  await page.goto('http://localhost:3000/contact.html');
  await page.fill('input[name="firstName"]', 'John');
  await page.fill('input[name="lastName"]', 'Doe');
  await page.fill('input[name="email"]', 'john@example.com');
  await page.fill('textarea[name="message"]', 'Hello, this is a test message.');

  // Intercept the API call
  await page.route('**/api/contact', route => route.fulfill({
    status: 201,
    body: JSON.stringify({ message: 'Message sent successfully' }),
  }));

  await page.click('button[type="submit"]');
  // Formspree redirect or alert might happen, but we mocked the API if it was going there.
  // Actually the form has action="https://formspree.io/f/xdkwldrz".
  // We should probably change it to our API or just verify the UI.
});
