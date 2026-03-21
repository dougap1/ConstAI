/**
 * ProgressBar — visual completion for task lists.
 * AI hook: pass `value` from agent-computed readiness or predicted completion.
 */
const toneBar = {
  strict:
    'from-sky-700 via-blue-600 to-cyan-400 shadow-[0_0_28px_rgba(14,165,233,0.35)]',
  calm: 'from-cyan-400 via-sky-400 to-blue-600 shadow-[0_0_24px_rgba(34,211,238,0.28)]',
  neutral:
    'from-blue-600 via-sky-500 to-cyan-400 shadow-[0_0_24px_rgba(37,99,235,0.28)]',
}

export default function ProgressBar({
  value,
  label = 'Progress',
  tone = 'neutral',
  className = '',
}) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3 text-xs font-medium tracking-wide text-slate-600 dark:text-slate-400">
        <span>{label}</span>
        <span className="tabular-nums text-slate-800 dark:text-slate-200">
          {Math.round(clamped)}%
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80 ring-1 ring-slate-300/50 dark:ring-slate-600/50"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full bg-linear-to-r transition-[width] duration-500 ease-out ${toneBar[tone] ?? toneBar.neutral}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
