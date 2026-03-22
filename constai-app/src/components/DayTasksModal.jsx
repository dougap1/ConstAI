import { getTaskAllottedMinutes } from '../lib/schedule'

export default function DayTasksModal({
  dateKey,
  dateLabel,
  goals,
  entries,
  onClose,
  onStartTimer,
}) {
  if (!dateKey) return null

  function minutesFor(goalId, task) {
    const g = goals.find((x) => x.id === goalId)
    if (!g) return task.durationMinutes ?? 25
    return getTaskAllottedMinutes(task, g)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[min(85vh,540px)] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2
            id="day-modal-title"
            className="text-sm font-semibold text-slate-900 dark:text-white"
          >
            {dateLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
        <ul className="max-h-[min(65vh,420px)] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-700">
          {!entries?.length ? (
            <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No tasks this day.
            </li>
          ) : null}
          {(entries || []).map(({ goalId, goalTitle, task }) => (
            <li
              key={`${goalId}-${task.id}`}
              className={`relative flex items-center gap-4 py-3 pl-4 ${
                task.done ? 'pr-12' : 'pr-4'
              }`}
            >
              {task.done ? (
                <span
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-2 ring-white dark:bg-emerald-500 dark:ring-slate-900"
                  aria-label="Completed"
                  title="Completed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-3.5"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  {goalTitle}
                </p>
                <p
                  className={`mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100 ${
                    task.done ? 'text-slate-500 line-through dark:text-slate-400' : ''
                  }`}
                >
                  {task.title}
                </p>
                {task.tip ? (
                  <p
                    className={`mt-1 text-xs leading-snug ${
                      task.done
                        ? 'text-slate-500 line-through dark:text-slate-500'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {task.tip}
                  </p>
                ) : null}
              </div>
              {!task.done ? (
                <div className="ml-auto flex w-24 shrink-0 flex-col items-stretch justify-center gap-1.5 sm:w-28">
                  <span className="text-center text-[10px] font-medium tabular-nums tracking-tight text-slate-500 dark:text-slate-400">
                    {minutesFor(goalId, task)} min
                  </span>
                  <button
                    type="button"
                    onClick={() => onStartTimer(goalId, task)}
                    className="w-full rounded-xl bg-sky-600 px-2 py-2 text-center text-xs font-semibold text-white shadow hover:bg-sky-500"
                  >
                    Timer
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
