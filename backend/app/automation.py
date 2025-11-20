import json
import os
from datetime import datetime
from playwright.async_api import async_playwright

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "screenshots")
HEADLESS = os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() in ("1", "true", "yes")

async def execute_steps(json_steps: str):
    steps = json.loads(json_steps)
    
    results = []
    screenshots = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)
        page = await browser.new_page()

        logs = []

        for i, step in enumerate(steps):
            action = step.get("action")
            selector = step.get("selector")
            value = step.get("value")

            logs.append(f"Executing action: {action} {selector or ''} {value or ''}".strip())

            try:
                if action == "navigate":
                    await page.goto(value)

                elif action == "click":
                    await page.click(selector)

                elif action == "type":
                    await page.fill(selector, value or "")

                elif action == "scroll":
                    distance = int(value) if value else 0
                    await page.evaluate(f"window.scrollBy(0, {distance})")

                elif action == "extract":
                    data = await page.locator(selector).all_inner_texts()
                    results.append({
                        "selector": selector,
                        "data": data if len(data) != 1 else data[0]
                    })

                elif action == "wait":
                    delay = float(value) if value else 1
                    await page.wait_for_timeout(delay * 1000)

                else:
                    logs.append(f"Unknown action '{action}' skipped.")

            except Exception as err:
                logs.append(f"Error in action '{action}': {err}")

            finally:
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
