import { useEffect, useMemo, useRef, useState } from 'react'
import GoalList from './components/GoalList'
import GoalDashboard from './components/GoalDashboard'
import Quote from './components/Quote'
import TonePicker from './components/TonePicker'
import ScrollLinkedStrip from './components/ScrollLinkedStrip'
import RemoveGoalDialog from './components/RemoveGoalDialog'
import CreateGoalWizard from './components/CreateGoalWizard'
import FocusTimerOverlay from './components/FocusTimerOverlay'
import GoalCelebrationModal from './components/GoalCelebrationModal'
import TaskCompletedToast from './components/TaskCompletedToast'
import GeminiDebugPanel from './components/GeminiDebugPanel'
import { DAILY_QUOTES } from './data/seedGoal'
import { buildIntakeForModel, createGoalFromIntake } from './lib/createGoalModel'
import {
  generateGoalPlanFromGemini,
  readGeminiApiKeyFromEnv,
} from './lib/geminiGoalPlan'
import { getTaskAllottedMinutes } from './lib/schedule'
import { recordGoalRemoveReflection } from './lib/analyticsStub'

const FLOW_CARDS = [
  {
    id: 'f1',
    kicker: 'Depth',
    title: 'Protect a single deep window',
    body: 'ConstAI keeps one honest block at a time. Let the timer carry the weight.',
  },
  {
    id: 'f2',
    kicker: 'Signal',
    title: 'Milestones over noise',
    body: 'Gemini shapes daily or weekly milestones from your deadline — alignment still comes from timer-completed work.',
  },
  {
    id: 'f3',
    kicker: 'Tone',
    title: 'Match the voice to the season',
    body: 'Strict mode tightens scheduling language toward meeting or beating the deadline.',
  },
  {
    id: 'f4',
    kicker: 'Timer',
    title: 'One timer per task',
    body: 'Each task has its own start button and session budget from your availability.',
  },
]

const MAX_DEBUG_JSON_CHARS = 12000

export default function App() {
  const [goals, setGoals] = useState([])
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const [tone, setTone] = useState('neutral')
  const [quoteIndex] = useState(() =>
    Math.floor(Math.random() * DAILY_QUOTES.length),
  )
  const [removeGoalTarget, setRemoveGoalTarget] = useState(null)
  const [timerSession, setTimerSession] = useState(null)
  const timerSessionRef = useRef(null)
  const [celebration, setCelebration] = useState(null)
  const [taskToast, setTaskToast] = useState(null)
  const [creatingGoal, setCreatingGoal] = useState(false)
  const [geminiDebug, setGeminiDebug] = useState(null)

  useEffect(() => {
    timerSessionRef.current = timerSession
  }, [timerSession])

  useEffect(() => {
    if (!taskToast) return
    const t = window.setTimeout(() => setTaskToast(null), 4500)
    return () => window.clearTimeout(t)
  }, [taskToast])

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) ?? null,
    [goals, selectedGoalId],
  )

  function celebrateIfJustFinished(prevGoal, nextGoal) {
    if (!nextGoal?.tasks?.length) return
    const total = nextGoal.tasks.length
    const before = prevGoal?.tasks.filter((t) => t.done).length ?? 0
    const after = nextGoal.tasks.filter((t) => t.done).length
    if (after === total && before < total) {
      queueMicrotask(() =>
        setCelebration({ title: nextGoal.title }),
      )
    }
  }

  const dailyQuote = DAILY_QUOTES[quoteIndex % DAILY_QUOTES.length]

  function handleSelectGoalFromList(goalId) {
    setSelectedGoalId(goalId)
  }

  async function handleIntakeComplete(intake) {
    setCreatingGoal(true)
    setGeminiDebug(null)
    try {
      let geminiRaw = null
      let geminiError = null
      let geminiCaught = null
      const apiKey = readGeminiApiKeyFromEnv()
      if (apiKey) {
        try {
          const payload = buildIntakeForModel(intake)
          geminiRaw = await generateGoalPlanFromGemini(payload, apiKey)
        } catch (err) {
          geminiCaught = err
          geminiError = err?.message || String(err)
          console.error('Gemini goal plan failed, using local fallback:', err)
        }
      }
      const goal = createGoalFromIntake(intake, geminiRaw)
      if (apiKey && goal.planSource === 'fallback') {
        let responsePreview = null
        if (geminiRaw != null) {
          try {
            const s = JSON.stringify(geminiRaw, null, 2)
            responsePreview =
              s.length > MAX_DEBUG_JSON_CHARS
                ? `${s.slice(0, MAX_DEBUG_JSON_CHARS)}\n\n… [truncated at ${MAX_DEBUG_JSON_CHARS} chars]`
                : s
          } catch {
            responsePreview = String(geminiRaw)
          }
        }
        if (geminiError) {
          setGeminiDebug({
            at: new Date().toISOString(),
            headline: 'Gemini request failed (template plan used)',
            detail: geminiError,
            stack: geminiCaught?.stack ?? null,
            responsePreview,
          })
        } else {
          setGeminiDebug({
            at: new Date().toISOString(),
            headline: 'Gemini returned JSON that failed validation',
            detail:
              'Tasks or milestonePlan did not pass local checks (see preview below). Compare shapes to normalizeGeminiGoalPlan in createGoalModel.js.',
            stack: null,
            responsePreview,
          })
        }
      }
      if (apiKey && goal.planSource === 'gemini') {
        setGeminiDebug(null)
      }
      setGoals((prev) => [...prev, goal])
      setTone(goal.toneStyle)
      setSelectedGoalId(goal.id)
    } finally {
      setCreatingGoal(false)
    }
  }

  function handleRequestRemoveGoal(goalId, goalTitle) {
    setRemoveGoalTarget({ goalId, goalTitle })
  }

  function handleConfirmRemoveGoal(reason) {
    if (!removeGoalTarget) return
    const { goalId } = removeGoalTarget
    void recordGoalRemoveReflection(reason)
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
    if (selectedGoalId === goalId) setSelectedGoalId(null)
    setRemoveGoalTarget(null)
  }

  function handleStartTaskTimer(task) {
    if (!selectedGoal || task.done) return
    setTimerSession({
      sessionId: crypto.randomUUID(),
      goalId: selectedGoal.id,
      taskId: task.id,
      taskTitle: task.title,
      goalTitle: selectedGoal.title,
      workMinutes: getTaskAllottedMinutes(task, selectedGoal),
    })
  }

  function handleTimerSessionComplete(taskId) {
    const gid = timerSessionRef.current?.goalId
    const title = timerSessionRef.current?.taskTitle
    if (!gid) return
    setGoals((prev) => {
      const prevG = prev.find((g) => g.id === gid)
      const next = prev.map((g) =>
        g.id !== gid
          ? g
          : {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === taskId ? { ...t, done: true } : t,
              ),
            },
      )
      const nextG = next.find((g) => g.id === gid)
      celebrateIfJustFinished(prevG, nextG)
      return next
    })
    if (title) {
      setTaskToast(`Session done — “${title}” is complete ✓`)
    }
  }

  return (
    <div className="constai-noise min-h-svh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#main"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:inline-block focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900 focus:shadow-lg dark:focus:bg-slate-900 dark:focus:text-white"
      >
        Skip to content
      </a>

      <header className="border-b border-slate-200/80 bg-white/40 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600 dark:text-sky-400">
              ConstAI
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Quiet structure for ambitious weeks
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Tasks unlock only through timed sessions. Remove a whole goal
              when the plan no longer fits — individual tasks stay fixed.
            </p>
          </div>
          <TonePicker value={tone} onChange={setTone} />
        </div>
      </header>

      <main
        id="main"
        className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8"
      >
        <Quote
          text={dailyQuote.text}
          attribution={dailyQuote.attribution}
          className="constai-animate-in"
        />

        {selectedGoal ? (
          <GoalDashboard
            goal={selectedGoal}
            tone={tone}
            onStartTaskTimer={handleStartTaskTimer}
            onBack={() => setSelectedGoalId(null)}
            onRequestRemoveGoal={() =>
              handleRequestRemoveGoal(selectedGoal.id, selectedGoal.title)
            }
          />
        ) : (
          <>
            <GoalList
              goals={goals}
              selectedGoalId={selectedGoalId}
              onSelectGoal={handleSelectGoalFromList}
              onRequestRemoveGoal={handleRequestRemoveGoal}
              headerSlot={
                <CreateGoalWizard
                  onComplete={handleIntakeComplete}
                  submitting={creatingGoal}
                />
              }
            />

            {goals.length === 0 ? (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Start with a name, then add context — ConstAI calls Gemini when{' '}
                <code className="text-sky-700 dark:text-sky-300">
                  VITE_GEMINI_API_KEY
                </code>{' '}
                is set; otherwise you get the local template plan.
              </p>
            ) : null}

            <ScrollLinkedStrip items={FLOW_CARDS} />
          </>
        )}
      </main>

      <RemoveGoalDialog
        open={Boolean(removeGoalTarget)}
        goalTitle={removeGoalTarget?.goalTitle ?? ''}
        onCancel={() => setRemoveGoalTarget(null)}
        onConfirm={handleConfirmRemoveGoal}
      />

      {timerSession ? (
        <FocusTimerOverlay
          key={timerSession.sessionId}
          goalTitle={timerSession.goalTitle}
          taskTitle={timerSession.taskTitle}
          taskId={timerSession.taskId}
          workMinutesTotal={timerSession.workMinutes}
          onClose={() => setTimerSession(null)}
          onSessionComplete={handleTimerSessionComplete}
        />
      ) : null}

      {celebration ? (
        <GoalCelebrationModal
          goalTitle={celebration.title}
          onExit={() => setCelebration(null)}
        />
      ) : null}

      <TaskCompletedToast
        message={taskToast}
        onDismiss={() => setTaskToast(null)}
      />

      <GeminiDebugPanel
        debug={geminiDebug}
        onDismiss={() => setGeminiDebug(null)}
      />

      <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        ConstAI — set{' '}
        <code className="text-sky-600 dark:text-sky-400">VITE_GEMINI_API_KEY</code>{' '}
        in <code className="text-sky-600 dark:text-sky-400">.env.local</code> for
        AI tasks &amp; milestones (structured JSON via Gemini).
      </footer>
    </div>
  )
}
