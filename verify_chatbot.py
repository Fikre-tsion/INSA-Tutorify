import asyncio
from playwright.async_api import async_playwright
import os

async def verify_chatbot():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Start server in background
        process = await asyncio.create_subprocess_shell(
            "npm start",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        await asyncio.sleep(3) # Wait for server

        try:
            await page.goto("http://localhost:3000")

            # Check if chatbot button exists
            chatbot_btn = page.locator("#chatbot-toggle")
            await chatbot_btn.wait_for()
            print("Chatbot button found.")

            # Click chatbot button
            await chatbot_btn.click()

            # Check if chatbot window is visible
            chatbot_window = page.locator("#chatbot-window")
            await chatbot_window.wait_for(state="visible")
            print("Chatbot window opened.")

            # Check welcome message
            welcome_msg = page.locator(".message.bot").first
            text = await welcome_msg.inner_text()
            print(f"Welcome message: {text}")

            # Type a question
            await page.fill("#chatbot-input-field", "What courses do you have?")
            await page.press("#chatbot-input-field", "Enter")

            # Wait for bot response
            bot_response = page.locator(".message.bot").nth(1)
            await bot_response.wait_for()
            response_text = await bot_response.inner_text()
            print(f"Bot response: {response_text}")

            # Take screenshot
            await page.screenshot(path="verification/chatbot_test.png")
            print("Screenshot saved to verification/chatbot_test.png")

            # Test language switch
            await page.select_option("#lang-selector", "am")
            await asyncio.sleep(1)

            # Re-open chat and check title in Amharic
            if not await chatbot_window.is_visible():
                await chatbot_btn.click()

            title = await page.locator("[data-i18n='chat_title']").inner_text()
            print(f"Amharic Title: {title}")

            await page.screenshot(path="verification/chatbot_amharic.png")

        finally:
            process.kill()
            await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify_chatbot())
