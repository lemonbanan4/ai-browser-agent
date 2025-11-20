"use client";

import { useState, useEffect } from "react";

type PlanStep = {
  action: string;
  selector?: string | null;
  value?: string | null;
};

type ExecutionResult = {
  selector?: string;
  data?: string[] | string;
  screenshot?: string;
  html?: string;
  [key: string]: any;
};

type RunResponse = {
  task_id: string;
  plan: PlanStep[];
  results: {
    results: ExecutionResult[];
    logs: string[];
  };
};

type HistoryItem = {
  id: string;
  command: string;
  created_at: string | null;
  last_result?: {
    id: string;
    created_at?: string | null;
    steps?: PlanStep[];
    logs?: string[];
    output?: ExecutionResult[];
  } | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PRESET_COMMANDS = [
  {
    title: "Extract Title",
    cmd: "Go to the current page and extract the page title.",
  },
  {
    title: "List Links",
    cmd: "Extract all links (anchor tags) on this page.",
  },
  {
    title: "Scroll Down",
    cmd: "Scroll down 800 pixels.",
  },
  {
    title: "Get Text",
    cmd: "Extract all visible text from the page.",
  },
  {
    title: "Take Screenshot",
    cmd: "Take a screenshot of the current page.",
  },
  {
    title: "Count Elements",
    cmd: "Count all clickable buttons on this page.",
  },
];

const PRESET_TASKS = [
  {
    category: "Scraping",
    items: [
      {
        title: "Scrape all links",
        description: "Collect all anchor tag URLs and texts on the page.",
        command:
          "Go to the given URL, then extract all <a> elements. Return a list of objects with text and href.",
      },
      {
        title: "Extract headings",
        description: "Get all H1–H3 headings from the page.",
        command:
          "Go to the given URL, then extract all h1, h2 and h3 elements with their innerText.",
      },
    ],
  },
  {
    category: "Jobs",
    items: [
      {
        title: "Search dev jobs",
        description: "Search for junior developer jobs on a job board.",
        command:
          "Go to a popular job board (like indeed.com or linkedin.com), search for 'junior developer remote', and extract a table with job title, company, and location for the first 10 results.",
      },
      {
        title: "Scrape job posting",
        description: "Extract details from a single job post URL.",
        command:
          "Go to the provided job posting URL and extract job title, company, location, salary (if present), and full description text.",
      },
    ],
  },
  {
    category: "E-commerce",
    items: [
      {
        title: "Scrape product list",
        description: "Collect product names and prices.",
        command:
          "Go to the given category page URL of an e-commerce site and extract product names and prices for the first 20 products.",
      },
      {
        title: "Single product details",
        description: "Extract price, title, and images.",
        command:
          "Go to the given product page URL and extract title, price, main image URL, and any rating information.",
      },
    ],
  },
];

function LemonBadge() {
  return (
    <div className="inline-flex items-center rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-500/10 via-lime-400/10 to-emerald-900/20 p-3 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
      <div className="relative h-12 w-12">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-lime-200 via-emerald-300 to-emerald-600 blur-md opacity-80" />
        <svg
          viewBox="0 0 60 60"
          className="relative h-full w-full drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]"
        >
          <defs>
            <linearGradient id="lemonNeon" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d9f99d" />
              <stop offset="50%" stopColor="#a3e635" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <circle cx="30" cy="30" r="26" fill="url(#lemonNeon)" stroke="#bbf7d0" strokeWidth="2" />
          <circle cx="30" cy="30" r="18" fill="#ecfccb" stroke="#bef264" strokeWidth="2" />
          <line x1="12" y1="30" x2="48" y2="30" stroke="#065f46" strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="12" x2="30" y2="48" stroke="#065f46" strokeWidth="2" strokeLinecap="round" />
          <line x1="17" y1="17" x2="43" y2="43" stroke="#065f46" strokeWidth="2" strokeLinecap="round" />
          <line x1="43" y1="17" x2="17" y2="43" stroke="#065f46" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [command, setCommand] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [plan, setPlan] = useState<PlanStep[] | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remoteHistory, setRemoteHistory] = useState<HistoryItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [history, setHistory] = useState<
    { command: string; timestamp: string; ok: boolean }[]
  >([]);
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/history`);
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setRemoteHistory(data.tasks || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };


  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    // Reset logs for new run
    setLiveLogs([]);

    let poller: any = null;

    // Start polling for logs every 600ms (fake-live)
    poller = setInterval(() => {
      setLiveLogs((old) => [...old, "...waiting for agent"]);
    }, 600);

    setIsRunning(true);
    setError(null);
    setPlan(null);
    setLogs([]);
    setResults([]);

    try {
      const res = await fetch(`${API_URL}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command }),
      });

      if (!res.ok) {
        throw new Error(`Backend error: ${res.status}`);
      }

      const data: RunResponse = await res.json();

      setPlan(data.plan);
      setLogs(data.results.logs || []);
      setResults(data.results.results || []);
      
      // refresh DB-backed history
      await fetchHistory();

      const newEntry = {
        command,
        timestamp: new Date().toLocaleTimeString(),
        ok: true,
      };

      setHistory((prev) => [newEntry, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");

      const newEntryErr = {
        command,
        timestamp: new Date().toLocaleTimeString(),
        ok: false,
      };

      setHistory((prev) => [newEntryErr, ...prev]);
    } finally {
      setIsRunning(false);
      if (poller) clearInterval(poller);
    }
  };

  // Load persisted history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("history");
      if (saved) setHistory(JSON.parse(saved));
    } catch (err) {
      console.warn("Failed to load history from localStorage", err);
    }
  }, []);

  // Persist history whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("history", JSON.stringify(history));
    } catch (err) {
      console.warn("Failed to save history to localStorage", err);
    }
  }, [history]);

  // Close lightbox on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedScreenshot(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-5xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400 text-sm">
            Initializing dashboard…
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-6 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_55%)]">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              AI Browser Automation Agent
            </h1>
            <p className="text-sm text-slate-400">
              Type a natural language command. The agent will plan steps, drive
              the browser, and return logs + results.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <LemonBadge />
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/30">
              Backend: {API_URL}
            </span>
          </div>
        </header>
        {/* Command input (sticky) */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-[0_0_25px_rgba(15,118,110,0.25)] backdrop-blur-sm lg:sticky lg:top-4 lg:z-20">
          <form onSubmit={handleRun} className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-200">Command</label>
              <p className="text-xs text-slate-400">
                Describe the automation you want. Use presets below if you need inspiration.
              </p>
            </div>
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-slate-950/90 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70 resize-none"
              placeholder='Examples: "Go to example.com and extract the page title" or "Search for Playwright docs and capture screenshot".'
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setCommand((prev) => prev + (prev ? " " : "") + "navigate ")}
                  className="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  navigate
                </button>
                <button
                  type="button"
                  onClick={() => setCommand((prev) => prev + (prev ? " " : "") + "click ")}
                  className="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  click
                </button>
                <button
                  type="button"
                  onClick={() => setCommand((prev) => prev + (prev ? " " : "") + "type ")}
                  className="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  type
                </button>
                <button
                  type="button"
                  onClick={() => setCommand((prev) => prev + (prev ? " " : "") + "scroll ")}
                  className="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  scroll
                </button>
                <button
                  type="button"
                  onClick={() => setCommand((prev) => prev + (prev ? " " : "") + "extract ")}
                  className="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  extract
                </button>
                <button
                  type="button"
                  onClick={() => setCommand((prev) => prev + (prev ? " " : "") + "screenshot")}
                  className="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  screenshot
                </button>
              </div>
              <button
                type="submit"
                disabled={isRunning}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700/60 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors"
              >
                {isRunning ? "Running..." : "Run Agent"}
                {isRunning && (
                  <div className="w-24 ml-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 animate-pulse bg-emerald-500" />
                  </div>
                )}
              </button>
            </div>
          </form>
          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </section>

        {/* Quick Templates */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {PRESET_COMMANDS.map((item, i) => (
            <button
              key={i}
              onClick={() => setCommand(item.cmd)}
              className="text-xs bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-2 hover:bg-slate-700 hover:border-emerald-500/50 transition-colors"
            >
              {item.title}
            </button>
          ))}
        </div>
      </section>

        {/* Preset tasks */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-[0_0_25px_rgba(16,185,129,0.08)]">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-[0.2em]">
              Preset Tasks
            </h2>
            <p className="text-xs text-slate-400">
              Click a card to drop a full natural-language command into the prompt box.
            </p>
          </div>
          <div className="space-y-4">
            {PRESET_TASKS.map((group) => (
              <div key={group.category} className="space-y-2">
                <div className="text-[11px] tracking-wide text-emerald-300 uppercase">
                  {group.category}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <button
                      type="button"
                      key={item.title}
                      onClick={() => setCommand(item.command)}
                      className="group relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 px-4 py-4 text-left transition hover:border-emerald-400/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
                      <div className="relative space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Preset</span>
                          <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
                            Fill command →
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-100">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-400 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Layout: left (plan + logs), right (results + history) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Plan + Logs */}
          <div className="space-y-4">
            {/* Plan */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-sm font-semibold mb-2">Planned Steps</h2>
              {!plan && (
                <p className="text-xs text-slate-500">
                  Run a command to see the model&apos;s browser plan.
                </p>
              )}
              {plan && plan.length === 0 && (
                <p className="text-xs text-slate-500">
                  No steps generated by the model.
                </p>
              )}
              {plan && plan.length > 0 && (
                <ol className="space-y-2 text-xs">
                  {plan.map((step, idx) => (
                    <li
                      key={idx}
                      className="rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2"
                    >
                      <div className="font-mono text-emerald-300">
                        {idx + 1}. {step.action}
                      </div>
                      {step.selector && (
                        <div className="text-slate-400">
                          selector: <span className="font-mono">{step.selector}</span>
                        </div>
                      )}
                      {step.value && (
                        <div className="text-slate-400">
                          value: <span className="font-mono break-all">{step.value}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Logs */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-sm font-semibold mb-2">Execution Logs</h2>
              {([...liveLogs, ...logs].length === 0) && (
                <p className="text-xs text-slate-500">
                  No logs yet. Run a command to see browser actions here.
                </p>
              )}
              {([...liveLogs, ...logs].length > 0) && (
                <div className="text-xs font-mono bg-slate-950/80 border border-slate-800 rounded-xl max-h-64 overflow-auto p-3 space-y-1">
                  {[...liveLogs, ...logs].map((log, i) => (
                    <div key={i}>• {log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results + History */}
          <div className="space-y-4">
            {/* Results */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-sm font-semibold mb-2">Results</h2>
              {results.length === 0 && (
                <p className="text-xs text-slate-500">
                  When the agent extracts data or takes screenshots, you&apos;ll
                  see it here.
                </p>
              )}
              {results.length > 0 && (
                <div className="space-y-3 text-xs">
                  {results.map((res, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 space-y-1"
                    >
                      {"selector" in res && res.selector && (
                        <div className="text-slate-400">
                          selector:{" "}
                          <span className="font-mono">{res.selector}</span>
                        </div>
                      )}

                      {"data" in res && res.data && (
                        <div className="text-slate-300">
                          {Array.isArray(res.data) ? (
                            <ul className="list-disc list-inside space-y-1">
                              {res.data.map((item, i) => (
                                <li key={i} className="break-all">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="break-all">{res.data}</p>
                          )}
                        </div>
                      )}

                      {"screenshot" in res && res.screenshot && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">📸 Screenshot:</span>
                            <span className="text-xs text-slate-500">{res.screenshot}</span>
                          </div>
                          <img
                            src={`${API_URL}/static/${res.screenshot}`}
                            alt="Screenshot"
                            onClick={() => setExpandedScreenshot(`${API_URL}/static/${res.screenshot}`)}
                            className="w-full rounded-lg border border-slate-700 cursor-pointer hover:border-emerald-500/60 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                          />
                        </div>
                      )}

                      {"html" in res && res.html && (
                        <details>
                          <summary className="cursor-pointer text-slate-400">
                            View HTML
                          </summary>
                          <pre className="mt-1 max-h-40 overflow-auto bg-black/60 p-2 rounded-lg">
                            {String(res.html).slice(0, 4000)}…
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-sm font-semibold mb-2">Run History (local)</h2>
              {history.length === 0 && (
                <p className="text-xs text-slate-500">
                  Your recent commands will appear here while this page is open.
                </p>
              )}
              {history.length > 0 && (
                <ul className="space-y-1 text-xs">
                  {history.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-2 rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2"
                    >
                      <div className="flex-1">
                        <div className="text-slate-300 break-all">
                          {item.command}
                        </div>
                        <div className="text-slate-500 text-[10px] mt-1">
                          {item.timestamp}
                        </div>
                      </div>
                      <span
                        className={`ml-2 mt-1 inline-flex h-5 min-w-[60px] items-center justify-center rounded-full text-[10px] font-medium ${
                          item.ok
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                            : "bg-red-500/15 text-red-300 border border-red-500/40"
                        }`}
                      >
                        {item.ok ? "OK" : "Error"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Screenshot Lightbox */}
      {expandedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setExpandedScreenshot(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={expandedScreenshot}
              alt="Fullscreen screenshot"
              className="rounded-lg max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setExpandedScreenshot(null)}
              className="absolute top-4 right-4 bg-slate-900/90 hover:bg-slate-800 text-white rounded-full p-2 border border-slate-700 transition-colors"
            >
              <span className="text-xl leading-none">✕</span>
            </button>
            <p className="absolute bottom-4 left-4 text-xs text-slate-400">
              Click to close or press ESC
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
