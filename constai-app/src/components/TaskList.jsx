import { getTaskAllottedMinutes } from '../lib/schedule'

/**
 * Tasks — timer-only completion; grouped by week when taskGroups provided.
 */
export default function TaskList({
  tasks,
  goal,
  taskGroups,
  tone = 'neutral',
  onStartTaskTimer,
}) {
  const ringFocus =
    tone === 'strict'
      ? 'focus-visible:ring-sky-500/60'
      : tone === 'calm'
        ? 'focus-visible:ring-cyan-400/60'
        : 'focus-visible:ring-blue-500/60'

  const groups =
    taskGroups?.length > 0
      ? taskGroups
      : [['Sessions', tasks]]

  function renderTask(task) {
    const mins = getTaskAllottedMinutes(task, goal)
    const done = task.done
    const meta = [task.sessionLabel, task.dayLabel].filter(Boolean).join(' · ')
    return (
      <li
        key={task.id}
        className={`flex flex-wrap items-center gap-2 rounded-xl border bg-white/50 px-3 py-2.5 backdrop-blur-sm dark:bg-slate-900/40 sm:flex-nowrap sm:gap-3 ${
          done
            ? 'border-emerald-300/60 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
            : 'border-slate-200/70 dark:border-slate-700/70'
        }`}
      >
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            done
              ? 'bg-emerald-600 text-white dark:bg-emerald-500'
              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}
          aria-hidden
        >
          {done ? '✓' : '○'}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <span
            className={`text-sm font-medium leading-snug text-slate-800 dark:text-slate-100 ${done ? 'text-slate-500 dark:text-slate-400' : ''}`}
          >
            {task.title}
          </span>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {meta ? `${meta} · ` : ''}
            {mins} min (plan)
          </p>
        </div>
        {done ? (
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Complete
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onStartTaskTimer?.(task)}
            className={`shrink-0 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${ringFocus}`}
          >
            Start timer
          </button>
        )}
      </li>
    )
  }

  return (
    <div className="space-y-6" role="list">
      {groups.map(([weekLabel, weekTasks]) => (
        <div key={weekLabel}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {weekLabel}
          </p>
          <ul className="space-y-2">{weekTasks.map(renderTask)}</ul>
        </div>
      ))}
    </div>
  )
}
