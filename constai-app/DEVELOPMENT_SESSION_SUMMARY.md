# CONST AI — development notes

**Canonical project documentation:** see **`README.md`** in this folder for setup, env vars, features, and repo layout.

This file is a **lightweight supplement**: architecture touchpoints and historical context. It contains **no API keys**.

---

## Architecture map (current)

| Layer | Role |
|-------|------|
| **`App.jsx`** | Goals state, `localStorage` sync via `goalStorage`, selected goal vs list, wizard step → header title, demo auth modal + session state, Gemini debug panel, timer overlay. |
| **`CreateGoalWizard`** | Two-step intake; `onStepChange` keeps header in sync; `onComplete` → async Gemini + `createGoalFromIntake`. |
| **`GoalDashboard`** | Cadence (“Overall Plan Summary”: stats, work days line, reasoning—**no** `recommendedRestDays` bullet list), progress, milestones **per schedule week**, day modal aggregation across goals. |
| **`DayTasksModal`** | Tasks for one date (all goals), tips, timer start. |
| **`DemoAuthModal`** | Demo-only UI; no persistence, no network. |
| **`geminiGoalPlan.js`** | `generateGoalPlanFromGemini`, JSON schema, system prompt, `todayDateKey` + `buildPlannerWeeks` in user payload. |
| **`planNormalize.js`** | Validates raw JSON; `alignMilestonesToPlannerWeeks`; `assignMissingScheduledDates`. |
| **`goalStorage.js`** | `constai-goals-v2` migrations; strips legacy fields over time. |

---

## Environment & security

- **`.env.local`** — `VITE_GEMINI_API_KEY`, optional `VITE_GEMINI_MODEL`. Ignored by git (see `.gitignore`).
- **`*.local`** — Also ignores other `*.local` files.
- Do not commit secrets; rotate keys if exposed.

---

## Commands (from `constai-app/`)

```bash
npm install
npm run dev
npm run build
npm run lint
```

Git from **repository root** (parent of `constai-app/` when nested): `git pull`, `git commit`, `git push`.

**Deploy:** See **README → Deploying (e.g. Vercel)** for root directory, `dist`, and env vars.

**Assets:** `public/favicon.svg` — blue lightning bolt favicon.

---

## Session history (abbreviated)

Earlier iterations added: Gemini structured plans, fallback template, debug panel on failure, minutes-based availability, planner weeks with local dates, milestones aligned to weeks, day-centric task UI with timers, demo auth header avatar, UI copy/branding updates, git hygiene for env files, Vercel + custom domain notes, plan summary UI tweak (no rest-day bullets), and favicon refresh.

*Safe to share; no credentials.*
