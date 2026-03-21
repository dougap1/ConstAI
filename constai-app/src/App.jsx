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
import { DAILY_QUOTES } from './data/seedGoal'
import { createGoalFromIntake } from './lib/createGoalModel'
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
    body: 'Deadlines drive daily or weekly milestone shapes — goal alignment tracks timer-completed work.',
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

  function handleIntakeComplete(intake) {
    const goal = createGoalFromIntake(intake)
    setGoals((prev) => [...prev, goal])
    setTone(goal.toneStyle)
    setSelectedGoalId(goal.id)
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
                <CreateGoalWizard onComplete={handleIntakeComplete} />
              }
            />

            {goals.length === 0 ? (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Start with a name, then add context — your goal opens with a
                default schedule until Gemini shapes it.
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

      <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        ConstAI — wire <code className="text-sky-600 dark:text-sky-400">intakeForGemini</code> when the API is ready.
      </footer>
    </div>
  )
}
