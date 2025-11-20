# Frontend – AI Browser Automation Agent

This Next.js (App Router + TypeScript) dashboard is the neon control room for the AI browser agent. It lets you type natural language commands, trigger Playwright runs, and review plans/logs/screenshots stored by the FastAPI backend.

## Features

- Sticky command palette with quick verb chips (`navigate`, `click`, `extract`, …)
- Preset task cards (scraping, jobs, ecommerce) that auto-fill the command input
- Live plan + log panels, screenshot lightbox, and local/remote histories
- Responsive dark-mode UI powered by Tailwind CSS

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `./.env.local` with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
   (Point this at your deployed FastAPI URL in production.)
3. Run the dev server:
   ```bash
   npm run dev
   # open http://localhost:3000
   ```

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx         # Main UI
│   └── layout.tsx
├── public/
└── README.md
```

## Deploying

- Deploy via Vercel for instant App Router support.
- Set `NEXT_PUBLIC_API_URL` in Vercel project settings to the backend (e.g., Railway URL).
- Optional: enable image optimization domains if your screenshots live off-origin.

## Portfolio Blurb
> Designed a neon-dark Next.js dashboard for an AI browser automation agent. Users can launch OpenAI-planned Playwright runs, browse histories, and inspect screenshots/logs in one sticky control panel.
