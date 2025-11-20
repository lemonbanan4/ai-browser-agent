from openai import OpenAI
import os
from dotenv import load_dotenv
import re

def clean_json(text: str) -> str:
    """
    Remove markdown fences like ```json ... ``` and extract just the JSON array.
    """
    # Remove ```json or ``` fences
    text = re.sub(r"```.*?```", lambda m: m.group(0).strip("`"), text, flags=re.DOTALL)
    text = text.replace("```json", "").replace("```", "").strip()

    # Extract the JSON array [ ... ]
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if match:
        return match.group(0)
    else:
        raise ValueError("No JSON array found in LLM output")
    

# Construct absolute path to the .env file manually
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, "..", ".env")

print("DEBUG: Loading .env from:", ENV_PATH)

load_dotenv(ENV_PATH)

print("DEBUG : Loaded Key:", os.getenv("OPENAI_API_KEY"))


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are an AI that turns natural language tasks into browser automation steps. Output a JSON list of actions.
Each action must have:
- "action": navigate | click | type | extract | wait | scroll
- "selector": CSS selector (if needed)
- "value": text or URL
"""

def generate_plan(command: str):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": command}
        ]
    )
    raw = response.choices[0].message.content
    return clean_json(raw)


    