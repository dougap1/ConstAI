# CONST AI (`constai-app`)

A React + Vite web app that helps you define goals, capture **weekday/weekend free minutes**, and generate a **deadline-aware plan** with **Gemini** (optional) or a **local fallback**. Plans include **milestones per calendar week**, **tasks on specific dates**, and a **schedule** you open by day—with **focus timers** per task.

**Data stays in the browser:** goals persist in `localStorage` (see below). **No backend** is required for core flows.

---

## Features

| Area | Description |
|------|-------------|
| **Goals** | Create goals via a two-step wizard (name → details: why, focus, deadline, free minutes). |
| **AI planning** | With a valid API key, Gemini returns structured JSON (cadence, milestones, dated tasks, tips). Invalid or missing responses use a **template plan** (`fallbackPlan`). |
| **Schedule** | Weeks from **today** through the **deadline**; each week shows a **milestone** and **day chips** (today highlighted). Tap a day to see **all goals’ tasks** for that date. |
| **Timers** | Start a session from the day modal; completion can mark the task done. |
| **Demo account** | Header avatar opens a **login/register demo** modal: accepts input only in memory—**nothing is stored or sent** (refresh clears it). |
| **Debug** | If Gemini fails or JSON fails validation, a **debug panel** can show the error and a response preview (no key values from env are logged by this UI). |
| **Plan summary** | **Overall Plan Summary** shows cadence stats, schedule type, **work days** (weekday names), and **reasoning** text only—no extra bullet list under it. |

---

## Tech stack

- **React 19**, **Vite 8**, **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **@google/generative-ai** for Gemini structured output (`responseSchema` + JSON MIME type)
- **ESLint 9** (`npm run lint`)

---

## Prerequisites

- **Node.js** (LTS recommended) and **npm**
- Optional: **Google AI Studio** API key for live Gemini plans ([Gemini API](https://ai.google.dev/gemini-api/docs))

---

## Setup

```bash
cd constai-app
npm install
```

### Environment variables (local only)

Create **`.env.local`** in the `constai-app` folder (same level as `package.json`). **Do not commit this file**; it is listed in `.gitignore`.

```env
# Required for live Gemini plans (optional — app uses a local template without it)
VITE_GEMINI_API_KEY=your_key_here

# Optional — defaults to gemini-2.5-flash in code if unset
# VITE_GEMINI_MODEL=gemini-2.5-flash
```

Restart **`npm run dev`** after changing env vars.

**Security:** Never push API keys. If a key was ever committed, **rotate it** in Google AI Studio and scrub git history if needed.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Vite HMR) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` | ESLint |

---

## Repository layout

This app often lives in a monorepo folder named `constai-app/` with **git root one level above** (parent `constai-app` repo). From the **parent** directory: `git pull`, `git push origin main`.

```
constai-app/
├── index.html
├── package.json
├── public/
│   └── favicon.svg             # Tab icon (blue lightning)
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx                 # Shell, header, demo auth, goal routing
│   ├── index.css
│   ├── components/             # UI (wizard, dashboard, modals, cards, …)
│   ├── lib/
│   │   ├── geminiGoalPlan.js   # Gemini client + schema + system prompt
│   │   ├── planNormalize.js    # Validate / clamp model output
│   │   ├── createGoalModel.js  # Intake → goal object
│   │   ├── goalStorage.js      # localStorage load/save + migrations
│   │   ├── calendar.js         # Planner weeks (local dates)
│   │   ├── plannerMilestones.js# Align milestones to week count
│   │   ├── taskDates.js        # Assign / normalize task dates
│   │   ├── fallbackPlan.js     # Offline plan when Gemini unavailable
│   │   ├── schedule.js         # Minutes-based schedule helpers
│   │   └── demoAuthAvatar.js   # Demo avatar initials (no persistence)
│   └── data/
└── README.md                   # This file
```

---

## Persistence

- **Goals:** `localStorage` key **`constai-goals-v2`** (`GOALS_STORAGE_KEY` in `src/lib/goalStorage.js`). Clearing site data removes goals.
- **Demo auth:** React state only; not written to `localStorage`.

---

## Gemini behavior (summary)

- **Model:** `VITE_GEMINI_MODEL` or default **`gemini-2.5-flash`**.
- **Input:** Goal intake JSON + `plannerWeekCount` / week labels derived from the deadline (local calendar).
- **Output:** Normalized in `planNormalize.js` (cadence, `planMilestones`, tasks with `scheduledDate`, optional `tip`). See `geminiGoalPlan.js` for the schema and system instructions.

Quota or billing errors from Google appear in the UI when the request fails; the app still creates a goal using the **fallback** plan when possible.

**Production:** Add the same **`VITE_*`** variables in your host’s dashboard (e.g. **Vercel → Project → Settings → Environment Variables**) for **Production**, then **redeploy**. Vite inlines them at **build time**. If the key works locally but not on the live site, check Vercel envs and any **API key restrictions** in Google AI Studio (domain allowlists).

**Security:** `VITE_GEMINI_API_KEY` is embedded in client JS. Treat it as public; use restricted keys and quotas, or add a server-side proxy for sensitive deployments.

---

## Deploying (e.g. Vercel)

1. Import the GitHub repo; set **Root Directory** to `constai-app` if the app is not at the repo root.
2. **Framework preset:** **Vite** (or **Other** with build `npm run build`, output **`dist`**).
3. Add **`VITE_GEMINI_API_KEY`** (and optional **`VITE_GEMINI_MODEL`**) under Environment Variables for **Production** (and Preview if needed).
4. Deploy; **custom domains** are added under **Settings → Domains** with DNS at your registrar.

---

## Branding & static assets

- **Favicon:** `public/favicon.svg` — blue lightning bolt on a dark blue tile; linked from `index.html` as `/favicon.svg`.
- In-app title / copy use **CONST AI** styling in the header.

---

## License / name

Project branding in the UI: **CONST AI**. Package name: `constai-app` (private).

---

## Further reading

- **`DEVELOPMENT_SESSION_SUMMARY.md`** — Short developer-oriented notes and session history (no secrets).
