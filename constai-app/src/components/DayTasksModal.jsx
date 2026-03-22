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
            <li key={`${goalId}-${task.id}`} className="flex gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  {goalTitle}
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {task.title}
                </p>
                {task.tip ? (
                  <p className="mt-1 text-xs leading-snug text-slate-600 dark:text-slate-400">
                    {task.tip}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end justify-center gap-1">
                {task.done ? (
                  <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    Done
                  </span>
                ) : (
                  <>
                    <span className="text-[10px] text-slate-500">
                      {minutesFor(goalId, task)} min
                    </span>
                    <button
                      type="button"
                      onClick={() => onStartTimer(goalId, task)}
                      className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-sky-500"
                    >
                      Timer
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
