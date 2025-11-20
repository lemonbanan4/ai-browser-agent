# AI Browser Automation Agent

An AI-powered browser automation platform that turns natural language commands into real browser actions using OpenAI, FastAPI, Playwright, and Next.js.

The agent can:
- Plan browser actions based on a plain English command
- Open a real Chromium browser
- Navigate, click, type, scroll, and extract data
- Take screenshots and save logs/results to a Postgres database
- Show all runs and history in a clean, neon dark-mode dashboard

---

## Tech Stack

**Backend**
- FastAPI (Python)
- OpenAI API (GPT-4o-mini) for planning
- Playwright for browser automation
- SQLAlchemy + Neon (Postgres) for persistence

**Frontend**
- Next.js (React, TypeScript)
- Tailwind CSS
- Dark mode neon UI
- History and result viewer

**Infra**
- Neon for Postgres
- Railway for backend hosting (FastAPI + Playwright)
- Vercel for frontend hosting

---

## Features

### 🔹 Natural Language → Automation Plan
You type a command like:

> "Go to example.com, extract the page title, and take a screenshot."

The backend:
1. Sends the command to OpenAI
2. Gets back a structured JSON plan of steps:

```json
[
  { "action": "navigate", "value": "https://example.com" },
  { "action": "extract", "selector": "title" },
  { "action": "screenshot", "value": "example.png" }
]
```

3. Runs each step in a real Chromium browser using Playwright
4. Streams back logs, screenshots, extracted HTML/text, and stores everything in Postgres

### 🔸 Full-Fidelity Browser Control
- Uses headful Chromium so you can watch the agent execute commands in real time
- Supports `navigate`, `click`, `type`, `scroll`, `extract`, and `screenshot` steps out of the box
- Adds a screenshot after every step for rich debugging context

### 🔸 Neon Dark-Mode Dashboard
- Quick Actions chips for verbs (`navigate`, `type`, `extract`, …) to speed up prompting
- Preset task cards (scraping, jobs, and ecommerce) that auto-fill the command box
- Sticky command palette so “Run Agent” is always a scroll away
- Plan, live logs, results, and history panes for an operator-friendly experience

### 🔸 Persistent History & Assets
- Task + result rows saved via SQLAlchemy to Neon Postgres
- Screenshot metadata tracked so the frontend can render previews/lightbox views
- Backend `/history` endpoint feeds the frontend history list

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI API key with access to GPT-4o-mini
- Postgres connection string (Neon recommended)

### Backend (FastAPI + Playwright)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env  # create if it doesn't exist
```
Populate `.env` with:
- `OPENAI_API_KEY=sk-...`
- `DATABASE_URL=postgresql+psycopg://...` (Neon URL or local Postgres)
- Any other service secrets you need (e.g., `PLAYWRIGHT_BROWSERS_PATH` in Railway)

Run the API:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Next.js dashboard)
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
# open http://localhost:3000
```

---

## Deployment

1. **Database** – Provision a Neon Postgres instance and grab the connection string.
2. **Backend** – Deploy `backend/` to Railway (or another FastAPI-friendly host). Attach the Neon URL, `OPENAI_API_KEY`, and ensure Playwright’s Chromium binary is available (`PLAYWRIGHT_BROWSERS_PATH=0` on Railway).
3. **Frontend** – Deploy `frontend/` to Vercel. Set `NEXT_PUBLIC_API_URL` to your deployed FastAPI URL so the dashboard hits the live backend.
4. **Screenshots** – Railway persists files temporarily. For long-term storage you can sync the `backend/screenshots` directory to object storage (S3, R2) or switch to uploading from Playwright directly.

---

## Project Structure

```
ai-browser-agent/
├── backend/
│   ├── app/           # FastAPI, SQLAlchemy models, Playwright automation
│   ├── requirements.txt
│   └── screenshots/   # Captured PNGs served via /screenshots
└── frontend/
    ├── app/           # Next.js (App Router) UI
    ├── public/
    └── README.md
```

---

## Portfolio Blurb
> Built a full-stack AI browser agent that converts natural language into executable Playwright plans. FastAPI + GPT-4o-mini orchestrate the automation, Neon stores runs/logs/screenshots, and a custom neon-dark Next.js dashboard lets users launch commands, browse histories, and review artifacts.

Show it off on your CV, and keep iterating by adding more preset task categories, auth, or team sharing 👏
