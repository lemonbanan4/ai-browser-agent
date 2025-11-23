# 🤖 AI Browser Automation Agent
Transform any natural-language instruction into real browser actions using FastAPI, Playwright, and an LLM.

Live Demo: https://ai-browser-agent-53uyknqxe-lemons-projects-858152ab.vercel.app  
Backend API: https://ai-browser-agent-xmgg.onrender.com

---

## 🚀 Overview
This project is a full-stack AI-driven browser automation system. You type prompts like:

> “Go to example.com and extract the title.”

The agent will:
1. Convert the instruction into a JSON plan via OpenAI
2. Run the steps in a real Chromium browser using Playwright
3. Return logs, extracted text, screenshots, and HTML
4. Persist every run (plan, output, assets) in Postgres
5. Display everything inside a neon-dark dashboard

---

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Client-side fetches with loading/error states

### Backend
- FastAPI + Uvicorn
- Playwright (Chromium)
- OpenAI `gpt-4o-mini`
- SQLAlchemy + Neon Postgres

### Infra
- Vercel (frontend)
- Render (backend)
- Neon (database)

---

## 📦 Features

- ✅ Natural language → automation plan
- ✅ Real browser control (navigate, click, type, extract, scroll, screenshot)
- ✅ Sticky command palette with quick inserts
- ✅ Preset task cards (scraping, jobs, ecommerce)
- ✅ Live plan/log/result panes with screenshot lightbox
- ✅ Durable history stored in Postgres + API `/history`
- ✅ Neon dark-mode UI, brand badge, loading animation, and error/success states

---

## 🧩 Project Structure

```
ai-browser-agent/
├── backend/
│   ├── app/              # FastAPI endpoints, LLM planner, Playwright runner
│   ├── requirements.txt
│   ├── Dockerfile
│   └── screenshots/      # PNG artifacts (gitignored, served via /screenshots)
└── frontend/
    ├── app/              # Next.js App Router UI
    ├── public/
    └── README.md
```

---

## 🧪 Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
playwright install chromium
cp .env.example .env  # create and fill with OPENAI_API_KEY, DATABASE_URL, etc.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev   # open http://localhost:3000
```

---

## ☁️ Deployment

1. **Database** – create a Neon Postgres instance and save the URL.
2. **Backend** (Render/Railway)  
   - Build from `backend/Dockerfile` (Playwright base).  
   - Set env vars: `OPENAI_API_KEY`, `DATABASE_URL`, `ALLOWED_ORIGINS=<vercel-domain>`, `PLAYWRIGHT_HEADLESS=true`, etc.  
   - Expose port `8000`.
3. **Frontend** (Vercel)  
   - Connect the repo and set `NEXT_PUBLIC_API_URL` to the backend HTTPS URL.  
   - Redeploy after env changes.

---

## 📝 Portfolio Blurb
> Built a production-style AI browser agent that turns text prompts into real Playwright automation. FastAPI + GPT-4o-mini plan the steps, Render-hosted Chromium executes them, Neon stores every run, and a neon Next.js dashboard lets users launch commands, inspect logs, and view screenshots in one place.

