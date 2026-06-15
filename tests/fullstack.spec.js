const { test, expect } = require('@playwright/test');

test.describe('Tutorify Fullstack Verification', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
    });

    test('should load the home page correctly', async ({ page }) => {
        await expect(page.locator('header h1')).toContainText('Welcome to Tutorify');
    });

    test('should allow user login and redirect', async ({ page }) => {
        await page.goto('http://localhost:3000/login.html');
        await page.fill('#login-email', 'pw@example.com');
        await page.fill('#login-password', 'password123');
        await page.selectOption('#login-role', 'user');

        page.on('dialog', async dialog => {
            console.log(dialog.message());
            await dialog.dismiss();
        });

        await page.click('#login-btn');

        await expect(page).toHaveURL(/.*index.html/, { timeout: 10000 });
        await expect(page.locator('#auth-link')).toContainText('Playwright User');
    });

    test('should load courses dynamically', async ({ page }) => {
        await page.goto('http://localhost:3000/courses.html');
        await page.waitForSelector('.course');
        const courses = await page.locator('.course').count();
        expect(courses).toBeGreaterThan(0);
    });

    test('should submit contact form', async ({ page }) => {
        await page.goto('http://localhost:3000/contact.html');
        await page.fill('#firstName', 'John');
        await page.fill('#lastName', 'Doe');
        await page.fill('#email', 'john@example.com');
        await page.fill('#message', 'Hello Tutorify!');

        await page.click('#submit-btn');
        await expect(page.locator('#status-msg')).toContainText('Message sent successfully!');
    });

    test('admin can access dashboard', async ({ page }) => {
        await page.goto('http://localhost:3000/login.html');
        await page.fill('#login-email', 'admin@tutorify.com');
        await page.fill('#login-password', 'password123');
        await page.selectOption('#login-role', 'admin');

        await page.click('#login-btn');

        await expect(page).toHaveURL(/.*dashboard.html/, { timeout: 10000 });
        await expect(page.locator('#stat-users')).not.toHaveText('0');
    });
});
