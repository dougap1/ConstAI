import ProgressBar from './ProgressBar'
import TaskList from './TaskList'

/**
 * GoalDashboard — milestones, tasks, note, timer entry, default schedule preview.
 * AI hook: inject coach copy, adaptive milestones, or smart task suggestions.
 */
const toneHints = {
  strict: 'High signal. No fluff between you and done.',
  calm: 'Breathe through the list — pace beats panic.',
  neutral: 'Steady rhythm. Adjust tone anytime.',
}

function SchedulePreview({ schedule }) {
  if (!schedule?.weekdays) return null
  return (
    <section className="constai-animate-in rounded-2xl border border-slate-200/80 bg-white/50 p-4 text-sm dark:border-slate-700/80 dark:bg-slate-900/40">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        Default schedule
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Generated from your availability until Gemini refines it.
      </p>
      <dl className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <div>
          <dt className="font-semibold text-sky-700 dark:text-sky-400">
            Weekdays ({schedule.weekdays.days?.join(' · ') ?? 'Mon–Fri'})
          </dt>
          <dd>{schedule.weekdays.windows?.join(' · ') ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sky-700 dark:text-sky-400">
            Weekends ({schedule.weekends?.days?.join(' · ') ?? 'Sat–Sun'})
          </dt>
          <dd>{schedule.weekends?.windows?.join(' · ') ?? '—'}</dd>
        </div>
      </dl>
    </section>
  )
}

export default function GoalDashboard({
  goal,
  tone,
  timerFocusTaskId,
  onTimerFocusTaskChange,
  onOpenTimer,
  onToggleTask,
  onRequestDeleteTask,
  onBack,
}) {
  const effectiveTone = goal.toneStyle ?? tone
  const done = goal.tasks.filter((t) => t.done).length
  const pct =
    goal.tasks.length === 0 ? 0 : (done / goal.tasks.length) * 100

  const focusTask =
    goal.tasks.find((t) => t.id === timerFocusTaskId) ??
    goal.tasks.find((t) => !t.done) ??
    goal.tasks[0]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800/80"
        >
          <span aria-hidden>←</span> All goals
        </button>
        <button
          type="button"
          onClick={onOpenTimer}
          className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-500 active:scale-[0.98] dark:shadow-sky-900/40"
        >
          <span className="tabular-nums" aria-hidden>
            ⏱
          </span>
          Focus timer
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
          {toneHints[effectiveTone] ?? toneHints.neutral}
        </p>
        {goal.focusArea ? (
          <p className="text-sm text-sky-700 dark:text-sky-300">
            Focus: {goal.focusArea}
          </p>
        ) : null}
      </header>

      <aside className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-sky-50/95 to-cyan-50/50 p-5 text-sm leading-relaxed text-slate-700 dark:border-slate-700/80 dark:from-sky-950/35 dark:to-slate-900/60 dark:text-slate-300">
        <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/90 dark:text-sky-300/90">
          Why it matters
        </p>
        <p className="mt-2">{goal.whyItMatters ?? goal.motivationalNote}</p>
      </aside>

      <SchedulePreview schedule={goal.schedule} />

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Weekly milestones
        </h3>
        <ol className="grid gap-2 sm:grid-cols-2">
          {goal.milestones.map((m, i) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2.5 text-sm transition hover:border-sky-200/80 dark:border-slate-700/70 dark:bg-slate-900/40 dark:hover:border-sky-900/50"
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
            Use <span className="font-medium text-sky-600 dark:text-sky-400">Focus</span>{' '}
            then start the timer — finishing counts for today.
          </span>
        </div>
        {focusTask ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Session target:{' '}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {focusTask.title}
            </span>
          </p>
        ) : null}
        <ProgressBar
          value={pct}
          tone={effectiveTone}
          label="Today’s alignment"
        />
        <TaskList
          tasks={goal.tasks}
          onToggleTask={onToggleTask}
          onRequestDeleteTask={onRequestDeleteTask}
          tone={effectiveTone}
          timerTargetTaskId={timerFocusTaskId}
          onSetTimerTarget={onTimerFocusTaskChange}
        />
      </section>
    </div>
  )
}
