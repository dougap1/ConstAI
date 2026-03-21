import { useMemo, useState } from 'react'
import GoalList from './components/GoalList'
import GoalDashboard from './components/GoalDashboard'
import Quote from './components/Quote'
import TonePicker from './components/TonePicker'
import ScrollLinkedStrip from './components/ScrollLinkedStrip'
import DeleteTaskDialog from './components/DeleteTaskDialog'
import {
  DAILY_QUOTES,
  dummyMilestones,
  dummyTasks,
  dummyMotivationalNote,
} from './data/seedGoal'
import { recordTaskDeleteReflection } from './lib/analyticsStub'

/**
 * Creates a goal with seeded dummy milestones/tasks.
 * Backend hook: POST /goals → replace with API response shape.
 * AI hook: merge agent-generated milestones & tasks into this object.
 */
function createGoal(title) {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    motivationalNote: dummyMotivationalNote(),
    milestones: dummyMilestones(),
    tasks: dummyTasks(),
  }
}

/** Horizontal strip cards — swap for AI “focus lanes” or live metrics later. */
const FLOW_CARDS = [
  {
    id: 'f1',
    kicker: 'Depth',
    title: 'Protect a single deep window',
    body: 'ConstAI is built for one honest block at a time. Let the edges blur on purpose.',
  },
  {
    id: 'f2',
    kicker: 'Signal',
    title: 'Milestones over noise',
    body: 'Weekly arcs give your brain a horizon. Tasks are just how you walk there.',
  },
  {
    id: 'f3',
    kicker: 'Agency',
    title: 'You choose the tone',
    body: 'Strict, calm, or neutral — future AI coaching can mirror the voice you want.',
  },
  {
    id: 'f4',
    kicker: 'Next',
    title: 'Timer & nudges',
    body: 'Placeholder controls are wired so Pomodoro, reminders, or agent pings drop in cleanly.',
  },
]

export default function App() {
  const [goals, setGoals] = useState([])
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [tone, setTone] = useState('neutral')
  const [quoteIndex] = useState(() =>
    Math.floor(Math.random() * DAILY_QUOTES.length),
  )
  const [deleteTarget, setDeleteTarget] = useState(null)

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) ?? null,
    [goals, selectedGoalId],
  )

  const dailyQuote = DAILY_QUOTES[quoteIndex % DAILY_QUOTES.length]

  function handleCreateGoal(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    const goal = createGoal(newTitle)
    setGoals((prev) => [...prev, goal])
    setNewTitle('')
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

  function handleTimerPlaceholder() {
    // AI / integrations: open Pomodoro, sync calendar focus, or start agent session
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
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-600 dark:text-violet-400">
              ConstAI
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Quiet structure for ambitious weeks
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Goals live in memory for now — drop in AI summaries or persistence
              when you wire the backend.
            </p>
          </div>
          <TonePicker value={tone} onChange={setTone} />
        </div>
      </header>

      <main
        id="main"
        className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8"
      >
        <Quote text={dailyQuote.text} attribution={dailyQuote.attribution} />

        {selectedGoal ? (
          <GoalDashboard
            goal={selectedGoal}
            tone={tone}
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
            onTimerClick={handleTimerPlaceholder}
          />
        ) : (
          <>
            <GoalList
              goals={goals}
              selectedGoalId={selectedGoalId}
              onSelectGoal={setSelectedGoalId}
              headerSlot={
                <form
                  onSubmit={handleCreateGoal}
                  className="rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/50"
                >
                  <label
                    htmlFor="new-goal"
                    className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    New goal
                  </label>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Saved in React state only — replace with API persist + AI
                    breakdown later.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      id="new-goal"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Ship ConstAI MVP"
                      className="min-h-11 flex-1 rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-500/10 transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      Create
                    </button>
                  </div>
                </form>
              }
            />

            {goals.length === 0 ? (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                No goals yet — name one above. Opening a goal reveals its
                dashboard, milestones, and tasks.
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

      <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        ConstAI skeleton — AI coach + sync hooks marked in code comments.
      </footer>
    </div>
  )
}
