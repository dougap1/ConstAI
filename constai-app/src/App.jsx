import { useEffect, useMemo, useRef, useState } from 'react'
import GoalList from './components/GoalList'
import GoalDashboard from './components/GoalDashboard'
import Quote from './components/Quote'
import TonePicker from './components/TonePicker'
import ScrollLinkedStrip from './components/ScrollLinkedStrip'
import DeleteTaskDialog from './components/DeleteTaskDialog'
import CreateGoalWizard from './components/CreateGoalWizard'
import FocusTimerOverlay from './components/FocusTimerOverlay'
import { DAILY_QUOTES } from './data/seedGoal'
import { createGoalFromIntake } from './lib/createGoalModel'
import { recordTaskDeleteReflection } from './lib/analyticsStub'

/** Horizontal strip — swap for AI “focus lanes” or live metrics later. */
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
    body: 'Weekly arcs give your brain a horizon. Tasks are how you walk there.',
  },
  {
    id: 'f3',
    kicker: 'Tone',
    title: 'Match the voice to the season',
    body: 'Each goal stores tone style for future Gemini coaching — strict, calm, or neutral.',
  },
  {
    id: 'f4',
    kicker: 'Timer',
    title: 'Finish the session, finish the task',
    body: 'Complete a focus run and today’s target task checks itself off — persistence hooks are ready.',
  },
]

export default function App() {
  const [goals, setGoals] = useState([])
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const [tone, setTone] = useState('neutral')
  const [quoteIndex] = useState(() =>
    Math.floor(Math.random() * DAILY_QUOTES.length),
  )
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [timerFocusTaskId, setTimerFocusTaskId] = useState(null)
  const [timerSession, setTimerSession] = useState(null)
  const timerSessionRef = useRef(null)

  useEffect(() => {
    timerSessionRef.current = timerSession
  }, [timerSession])

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) ?? null,
    [goals, selectedGoalId],
  )

  const dailyQuote = DAILY_QUOTES[quoteIndex % DAILY_QUOTES.length]

  function handleSelectGoalFromList(id) {
    setTimerFocusTaskId(null)
    setSelectedGoalId(id)
  }

  function handleIntakeComplete(intake) {
    const goal = createGoalFromIntake(intake)
    setGoals((prev) => [...prev, goal])
    setTone(goal.toneStyle)
    setTimerFocusTaskId(null)
    setSelectedGoalId(goal.id)
  }

  function handleToggleTask(goalId, taskId) {
    setGoals((prev) =>
      prev.map((g) =>
        g.id !== goalId
          ? g
          : {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t,
              ),
            },
      ),
    )
  }

  function handleConfirmDelete(reason) {
    if (!deleteTarget) return
    const { goalId, taskId } = deleteTarget
    void recordTaskDeleteReflection(reason)
    setGoals((prev) =>
      prev.map((g) =>
        g.id !== goalId
          ? g
          : { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) },
      ),
    )
    setDeleteTarget(null)
  }

  function handleOpenTimer() {
    if (!selectedGoal) return
    const id =
      timerFocusTaskId ??
      selectedGoal.tasks.find((t) => !t.done)?.id ??
      selectedGoal.tasks[0]?.id
    const task = selectedGoal.tasks.find((t) => t.id === id)
    if (!task) return
    setTimerSession({
      goalId: selectedGoal.id,
      taskId: task.id,
      taskTitle: task.title,
      goalTitle: selectedGoal.title,
    })
  }

  function handleTimerSessionComplete(taskId) {
    const gid = timerSessionRef.current?.goalId
    if (!gid) return
    setGoals((prev) =>
      prev.map((g) =>
        g.id !== gid
          ? g
          : {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === taskId ? { ...t, done: true } : t,
              ),
            },
      ),
    )
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
              Goals hold intake for Gemini later — today they run on smart
              defaults and local state.
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
            timerFocusTaskId={timerFocusTaskId}
            onTimerFocusTaskChange={setTimerFocusTaskId}
            onOpenTimer={handleOpenTimer}
            onToggleTask={(taskId) =>
              handleToggleTask(selectedGoal.id, taskId)
            }
            onRequestDeleteTask={(taskId) => {
              const t = selectedGoal.tasks.find((x) => x.id === taskId)
              if (t)
                setDeleteTarget({
                  goalId: selectedGoal.id,
                  taskId,
                  taskTitle: t.title,
                })
            }}
            onBack={() => setSelectedGoalId(null)}
          />
        ) : (
          <>
            <GoalList
              goals={goals}
              selectedGoalId={selectedGoalId}
              onSelectGoal={handleSelectGoalFromList}
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

      <DeleteTaskDialog
        open={Boolean(deleteTarget)}
        taskTitle={deleteTarget?.taskTitle ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {timerSession ? (
        <FocusTimerOverlay
          key={timerSession.sessionId}
          goalTitle={timerSession.goalTitle}
          taskTitle={timerSession.taskTitle}
          taskId={timerSession.taskId}
          onClose={() => setTimerSession(null)}
          onSessionComplete={handleTimerSessionComplete}
        />
      ) : null}

      <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        ConstAI — wire <code className="text-sky-600 dark:text-sky-400">intakeForGemini</code> when the API is ready.
      </footer>
    </div>
  )
}
