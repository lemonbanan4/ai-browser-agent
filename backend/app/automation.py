import json
import os
from datetime import datetime
from playwright.async_api import async_playwright

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "screenshots")

async def execute_steps(json_steps: str):
    steps = json.loads(json_steps)
    
    results = []
    screenshots = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        logs = []

        for i, step in enumerate(steps):
            action = step.get("action")
            selector = step.get("selector")
            value = step.get("value")

            logs.append(f"Executing action: {action} {selector or ''} {value or ''}")

            if action == "navigate":
                await page.goto(value)

            elif action == "click":
                await page.click(selector)

            elif action == "type":
                await page.fill(selector, value)

            elif action == "scroll":
                await page.evaluate(f"window.scrollBy(0, {int(value)})")

            elif action == "extract":
                data = await page.locator(selector).inner_text()
                results.append({
                    "selector": selector,
                    "data": data
                })

            # After each step: screenshot
            filename = f"{datetime.utcnow().timestamp()}_{i}.png"
            filepath = os.path.join(SCREENSHOT_DIR, filename)
            await page.screenshot(path=filepath)

            screenshots.append(filename)

        await browser.close()

    return {
        "results": results,
        "logs": logs,
        "screenshots": screenshots
    }
