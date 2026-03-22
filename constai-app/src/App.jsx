import { useEffect, useMemo, useRef, useState } from 'react'
import GoalList from './components/GoalList'
import GoalDashboard from './components/GoalDashboard'
import RemoveGoalDialog from './components/RemoveGoalDialog'
import CreateGoalWizard from './components/CreateGoalWizard'
import FocusTimerOverlay from './components/FocusTimerOverlay'
import GoalCelebrationModal from './components/GoalCelebrationModal'
import TaskCompletedToast from './components/TaskCompletedToast'
import GeminiDebugPanel from './components/GeminiDebugPanel'
import DemoAuthModal from './components/DemoAuthModal'
import { getDemoAvatarLabel } from './lib/demoAuthAvatar'
import { buildIntakeForModel, createGoalFromIntake } from './lib/createGoalModel'
import {
  generateGoalPlanFromGemini,
  readGeminiApiKeyFromEnv,
} from './lib/geminiGoalPlan'
import { getTaskAllottedMinutes } from './lib/schedule'
import { recordGoalRemoveReflection } from './lib/analyticsStub'
import { loadGoalsFromStorage, saveGoalsToStorage } from './lib/goalStorage'

const MAX_DEBUG_JSON_CHARS = 12000

export default function App() {
  const [goals, setGoals] = useState(() => loadGoalsFromStorage())
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const [removeGoalTarget, setRemoveGoalTarget] = useState(null)
  const [timerSession, setTimerSession] = useState(null)
  const timerSessionRef = useRef(null)
  const [celebration, setCelebration] = useState(null)
  const [taskToast, setTaskToast] = useState(null)
  const [creatingGoal, setCreatingGoal] = useState(false)
  const [geminiDebug, setGeminiDebug] = useState(null)
  const [wizardStep, setWizardStep] = useState(1)
  const [demoAuthModalOpen, setDemoAuthModalOpen] = useState(false)
  const [demoAuthSession, setDemoAuthSession] = useState(null)

  useEffect(() => {
    timerSessionRef.current = timerSession
  }, [timerSession])

  useEffect(() => {
    if (!taskToast) return
    const t = window.setTimeout(() => setTaskToast(null), 4500)
    return () => window.clearTimeout(t)
  }, [taskToast])

  useEffect(() => {
    saveGoalsToStorage(goals)
  }, [goals])

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) ?? null,
    [goals, selectedGoalId],
  )

  useEffect(() => {
    if (selectedGoalId) setWizardStep(1)
  }, [selectedGoalId])

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
                ? `${s.slice(0, MAX_DEBUG_JSON_CHARS)}\n\n… [truncated]`
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
              'Response did not pass planNormalize.js checks. See preview below.',
            stack: null,
            responsePreview,
          })
        }
      }
      if (apiKey && goal.planSource === 'gemini') {
        setGeminiDebug(null)
      }
      setGoals((prev) => [...prev, goal])
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

  function handleStartTaskTimer(goalId, task) {
    const g = goals.find((x) => x.id === goalId)
    if (!g || task.done) return
    setTimerSession({
      sessionId: crypto.randomUUID(),
      goalId: g.id,
      taskId: task.id,
      taskTitle: task.title,
      goalTitle: g.title,
      workMinutes: getTaskAllottedMinutes(task, g),
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
      setTaskToast(`Done — “${title}”`)
    }
  }

  return (
    <div className="constai-noise min-h-svh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#main"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:inline-block focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900 focus:shadow-lg dark:focus:bg-slate-900 dark:focus:text-white"
      >
        Skip to content
      </a>

      <header className="border-b border-slate-200/80 bg-white/40 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="inline-block bg-gradient-to-r from-sky-600 via-sky-200 to-cyan-400 bg-clip-text text-2xl font-black uppercase tracking-[0.22em] text-transparent antialiased drop-shadow-[0_0_16px_rgba(14,165,233,0.45)] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)] sm:text-3xl sm:tracking-[0.26em] dark:from-sky-100 dark:via-white dark:to-cyan-200 dark:drop-shadow-[0_0_22px_rgba(34,211,238,0.4)] dark:drop-shadow-[0_1px_0_rgba(255,255,255,0.2)]">
                CONST AI
              </p>
              <h1 className="mt-2 font-display text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {selectedGoal
                  ? 'Ultimate Plan for Your Goal'
                  : wizardStep === 2
                    ? 'How to Tackle Your Goal'
                    : "What's Your Goal?"}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setDemoAuthModalOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-gradient-to-br from-sky-50 to-white text-xs font-bold text-sky-800 shadow-md shadow-sky-500/10 transition hover:border-sky-300/80 hover:shadow-lg dark:border-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-sky-200 dark:hover:border-sky-500/40"
              aria-label={
                demoAuthSession
                  ? `Account: ${demoAuthSession.displayName || demoAuthSession.email}`
                  : 'Open sign in or register (demo)'
              }
            >
              {demoAuthSession ? (
                getDemoAvatarLabel(demoAuthSession)
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5 opacity-80"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 6a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
      >
        {selectedGoal ? (
          <GoalDashboard
            goal={selectedGoal}
            allGoals={goals}
            onStartTaskTimer={handleStartTaskTimer}
            onBack={() => setSelectedGoalId(null)}
            onRequestRemoveGoal={() =>
              handleRequestRemoveGoal(selectedGoal.id, selectedGoal.title)
            }
          />
        ) : (
          <GoalList
            goals={goals}
            selectedGoalId={selectedGoalId}
            onSelectGoal={handleSelectGoalFromList}
            onRequestRemoveGoal={handleRequestRemoveGoal}
            headerSlot={
              <CreateGoalWizard
                onComplete={handleIntakeComplete}
                submitting={creatingGoal}
                onStepChange={setWizardStep}
              />
            }
          />
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

      <DemoAuthModal
        open={demoAuthModalOpen}
        onClose={() => setDemoAuthModalOpen(false)}
        session={demoAuthSession}
        onDemoSessionChange={setDemoAuthSession}
      />

      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        CONST AI
      </footer>
    </div>
  )
}
