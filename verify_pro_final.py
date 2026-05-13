import asyncio
from playwright.async_api import async_playwright
import os

async def verify_pro_final():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Start server
        process = await asyncio.create_subprocess_shell(
            "node server/server.js",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await asyncio.sleep(3)

        try:
            # 1. Test Onboarding Redirect
            await page.goto("http://localhost:3000/login.html")
            await page.fill('#loginEmail', "test@example.com")
            await page.fill('#loginPassword', "password123")
            await page.click('#loginBtn')

            # Should redirect to onboarding since we updated schema to 'pending'
            await page.wait_for_url("**/onboarding.html")
            print("Successfully redirected to onboarding.")

            # Fill onboarding
            await page.fill('#nickname', 'JulesTheDev')
            await page.click('button:has-text("Next")')
            await page.click('text=Programming')
            await page.click('button:has-text("Complete")')

            await page.wait_for_url("**/index.html")
            print("Successfully completed onboarding.")

            # 2. Check Personalized Recommendations
            await page.wait_for_selector("#recommended-section:not(.hidden)")
            rec_title = await page.locator("#recommended-courses-container h4").first.inner_text()
            print(f"Personalized check: Found recommendation '{rec_title}'")
            await page.screenshot(path="verification/pro_home_personalized.png")

            # 3. Check Chat Personalization
            await page.click("#chatbot-toggle")
            await page.fill("#chatbot-input-field", "hello")
            await page.press("#chatbot-input-field", "Enter")

            bot_reply = page.locator(".message.bot").nth(1)
            await bot_reply.wait_for()
            reply_text = await bot_reply.inner_text()
            print(f"Chat personalization check: {reply_text}")

            # 4. Check Profile & Social Icons
            await page.goto("http://localhost:3000/profile.html")
            await page.fill("#linkedin", "https://linkedin.com/in/jules")
            await page.click('button:has-text("Save Profile Changes")')
            print("Social link saved.")
            await page.screenshot(path="verification/pro_profile.png")

        finally:
            process.kill()
            await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify_pro_final())
