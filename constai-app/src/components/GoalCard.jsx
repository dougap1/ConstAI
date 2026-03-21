/**
 * GoalCard — single goal preview; opens dashboard on activate.
 * AI hook: show AI-generated summary or “next best action” badge.
 */
export default function GoalCard({
  title,
  taskTotal,
  taskDone,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl text-left transition ${
        selected
          ? 'ring-2 ring-violet-500/60 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950'
          : ''
      }`}
    >
      <div
        className={`rounded-2xl border bg-white/70 p-4 backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900/60 ${
          selected
            ? 'border-violet-400/50 shadow-md dark:border-violet-500/40'
            : 'border-slate-200/80 hover:border-slate-300 dark:border-slate-700/80 dark:hover:border-slate-600'
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Goal
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {taskDone}/{taskTotal} daily tasks aligned
        </p>
      </div>
    </button>
  )
}
