# ConstAI — session summary (copy/paste)

Concise record of work aligned with this Cursor session: goals, your prompts, and what changed in the codebase.

---

## Your prompts (chronological)

1. **Run the server** — How to run the dev server to view the webpage.
2. **Pull from GitHub** — Pull the latest `ConstAI` repo; later **pull again** after remote updates.
3. **Where to see changes** — How to view diffs (local app, `git`, GitHub).
4. **Commit changes** — Commit when the working tree was clean (nothing to commit).
5. **Gemini integration** — Wire **Google Gemini** after goal wizard submit: structured **JSON** (not markdown), personalized **tasks** and **milestones**; **weekly** vs **daily** milestones from deadline horizon; keep user intake fields.
6. **Push to repository** — Push `main` to `origin`.
7. **Remove API key from repo** — Secret had been committed in `.env.example`; **history rewritten** + **force-push**; rotate key advised.
8. **AI failures / debugging** — Show errors **persistently** (not a short toast) for debugging.
9. **Gemini 1.5 Pro** — Set model via env; fixed wrong var **`VITE_MODEL`** → **`VITE_GEMINI_MODEL`**.
10. **Best model & how data is sent** — Explained Flash vs Pro, and single JSON user payload + `responseSchema`.
11. **404 `gemini-1.5-pro`** — Explained retired/invalid id; moved to **`gemini-2.5-pro`** / default **`gemini-2.5-flash`**.
12. **Push + hide env files + this document** — Git push; **do not track** `.env.local` / `.env.example`; session doc with prompts.

---

## Technical changes (what shipped)

| Area | Change |
|------|--------|
| **Gemini** | `@google/generative-ai`, `generateGoalPlanFromGemini()` with `responseMimeType: application/json` + `responseSchema`. |
| **Goal creation** | `createGoalFromIntake(intake, geminiRaw)`; `buildIntakeForModel`; `normalizeGeminiGoalPlan` validation + fallback template plan. |
| **Milestones** | `getDaysUntilDeadline`; **≤14 days** → daily ladder; **>14** → weekly + nested dailies (fallback + AI instructions). |
| **App** | Async wizard submit; loading state; toast for timer completion; **Gemini debug panel** on API/validation failure (persistent, copy, dismiss). |
| **Models** | `VITE_GEMINI_MODEL`; defaults updated for current API (**2.5** family). |
| **Security** | Leaked key removed from history; **`.env.local`** and **`.env.example`** intended to stay **untracked** (see `.gitignore`). |

---

## Local environment (not in git)

Create **`constai-app/.env.local`** next to `package.json` (restart `npm run dev` after edits):

```env
VITE_GEMINI_API_KEY=your_key_from_ai_studio

# Optional — see https://ai.google.dev/gemini-api/docs/models
VITE_GEMINI_MODEL=gemini-2.5-pro
```

You can copy **`constai-app/.env.example`** on your machine as a starting template; it is **gitignored** alongside `.env.local` so secrets and local copies are not pushed.

---

## Commands reference

```bash
cd constai-app
npm install
npm run dev
```

Repo root (parent of `constai-app/`): `git pull`, `git push origin main`.

---

*Generated for handoff / portfolio notes — safe to share; contains no API keys.*
