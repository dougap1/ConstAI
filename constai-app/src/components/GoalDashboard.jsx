import ProgressBar from './ProgressBar'
import TaskList from './TaskList'

/**
 * GoalDashboard — milestones, tasks, note, timer placeholder.
 * AI hook: inject coach copy, adaptive milestones, or smart task suggestions.
 */
const toneHints = {
  strict: 'High signal. No fluff between you and done.',
  calm: 'Breathe through the list — pace beats panic.',
  neutral: 'Steady rhythm. Adjust tone anytime.',
}

export default function GoalDashboard({
  goal,
  tone,
  onToggleTask,
  onRequestDeleteTask,
  onBack,
  onTimerClick,
}) {
  const done = goal.tasks.filter((t) => t.done).length
  const pct =
    goal.tasks.length === 0 ? 0 : (done / goal.tasks.length) * 100

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800/80"
        >
          <span aria-hidden>←</span> All goals
        </button>
        <button
          type="button"
          onClick={onTimerClick}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <span className="tabular-nums">⏱</span>
          Timer <span className="text-white/70 dark:text-slate-500">· soon</span>
        </button>
      </div>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
          Dashboard
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {goal.title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {toneHints[tone] ?? toneHints.neutral}
        </p>
      </header>

      <aside className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-violet-50/90 to-cyan-50/40 p-5 text-sm leading-relaxed text-slate-700 dark:border-slate-700/80 dark:from-violet-950/40 dark:to-slate-900/60 dark:text-slate-300">
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600/80 dark:text-violet-300/80">
          Note for you
        </p>
        <p className="mt-2">{goal.motivationalNote}</p>
      </aside>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Weekly milestones
        </h3>
        <ol className="grid gap-2 sm:grid-cols-2">
          {goal.milestones.map((m, i) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2.5 text-sm dark:border-slate-700/70 dark:bg-slate-900/40"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {m.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {m.week}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Daily tasks
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Check off to move the bar
          </span>
        </div>
        <ProgressBar value={pct} tone={tone} label="Today’s alignment" />
        <TaskList
          tasks={goal.tasks}
          onToggleTask={onToggleTask}
          onRequestDeleteTask={onRequestDeleteTask}
          tone={tone}
        />
      </section>
    </div>
  )
}
