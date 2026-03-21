/**
 * TaskList — checklist with completion toggles and delete affordance.
 * AI hook: reorder tasks by priority, suggest titles, or auto-break down goals.
 */
export default function TaskList({
  tasks,
  onToggleTask,
  onRequestDeleteTask,
  tone = 'neutral',
  timerTargetTaskId,
  onSetTimerTarget,
}) {
  const ringFocus =
    tone === 'strict'
      ? 'focus-visible:ring-sky-500/60'
      : tone === 'calm'
        ? 'focus-visible:ring-cyan-400/60'
        : 'focus-visible:ring-blue-500/60'

  return (
    <ul className="space-y-2" role="list">
      {tasks.map((task) => {
        const isTarget = timerTargetTaskId === task.id
        return (
          <li
            key={task.id}
            className={`group flex items-start gap-3 rounded-xl border bg-white/50 px-3 py-2.5 backdrop-blur-sm transition hover:border-slate-300/90 dark:bg-slate-900/40 dark:hover:border-slate-600/90 ${
              isTarget
                ? 'border-sky-400/70 ring-1 ring-sky-400/30 dark:border-sky-500/50'
                : 'border-slate-200/70 dark:border-slate-700/70'
            }`}
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => onToggleTask(task.id)}
              className={`mt-1 size-4 shrink-0 rounded-md border-slate-400 text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${ringFocus}`}
              aria-label={`Mark complete: ${task.title}`}
            />
            <span
              className={`min-w-0 flex-1 text-left text-sm leading-snug text-slate-800 dark:text-slate-100 ${task.done ? 'text-slate-400 line-through dark:text-slate-500' : ''}`}
            >
              {task.title}
            </span>
            {onSetTimerTarget ? (
              <button
                type="button"
                onClick={() => onSetTimerTarget(task.id)}
                className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium transition ${
                  isTarget
                    ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                    : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-sky-500/10 hover:text-sky-600 dark:text-slate-500 dark:hover:text-sky-400'
                }`}
                aria-pressed={isTarget}
              >
                {isTarget ? 'Session' : 'Focus'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onRequestDeleteTask(task.id)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:text-rose-400"
            >
              Remove
            </button>
          </li>
        )
      })}
    </ul>
  )
}
