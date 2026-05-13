import asyncio
from playwright.async_api import async_playwright
import os

async def verify_pro_features():
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
            # 1. Check Courses Page for Ratings
            await page.goto("http://localhost:3000/courses.html")
            await page.wait_for_selector(".course")
            rating_text = await page.locator(".course .uil-star").first.inner_text()
            print(f"Ratings check: Found star icon on courses.")
            await page.screenshot(path="verification/pro_courses.png")

            # 2. Login as a student to check progress/player
            await page.goto("http://localhost:3000/login.html")
            await page.fill('#loginEmail', "test@example.com")
            await page.fill('#loginPassword', "password123")
            await page.click('#loginBtn')
            await page.wait_for_url("**/index.html")

            # 3. Go to Course Player
            await page.goto("http://localhost:3000/course-player.html?id=1")
            await page.wait_for_selector(".lesson-item")
            lesson_title = await page.locator("#lesson-title").inner_text()
            print(f"Course Player check: Loaded lesson '{lesson_title}'")
            await page.screenshot(path="verification/pro_player.png")

            # 4. Check Certificate Page (mocked params)
            await page.goto("http://localhost:3000/certificate.html?courseTitle=Mastering%20AI&studentName=Jules")
            await page.wait_for_selector(".certificate")
            cert_name = await page.locator("#student-name").inner_text()
            print(f"Certificate check: Generated for '{cert_name}'")
            await page.screenshot(path="verification/pro_certificate.png")

        finally:
            process.kill()
            await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify_pro_features())
