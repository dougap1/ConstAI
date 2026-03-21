import { useMemo } from 'react'

function ConfettiPiece({ delay, left, color }) {
  return (
    <span
      className="constai-confetti-piece pointer-events-none absolute top-0 size-2 rounded-sm opacity-90"
      style={{
        left: `${left}%`,
        backgroundColor: color,
        animationDelay: `${delay}ms`,
      }}
      aria-hidden
    />
  )
}

/**
 * Full goal completion — confetti + celebratory emojis (system / Apple set).
 */
export default function GoalCelebrationModal({ goalTitle, onExit }) {
  const pieces = useMemo(() => {
    const colors = [
      '#38bdf8',
      '#22d3ee',
      '#a5f3fc',
      '#fbbf24',
      '#fcd34d',
      '#f472b6',
      '#c084fc',
    ]
    return Array.from({ length: 42 }, (_, i) => ({
      id: i,
      delay: (i % 12) * 40,
      left: (i * 17 + (i % 7) * 3) % 100,
      color: colors[i % colors.length],
    }))
  }, [])

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-celebrate-title"
    >
      <div className="constai-scale-in relative w-full max-w-md overflow-hidden rounded-3xl border border-sky-400/30 bg-linear-to-b from-slate-900 to-slate-950 px-8 py-10 text-center shadow-2xl shadow-sky-900/40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden">
          {pieces.map((p) => (
            <ConfettiPiece key={p.id} {...p} />
          ))}
        </div>

        <p
          id="goal-celebrate-title"
          className="relative font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          You finished the goal 🎉
        </p>
        <p className="relative mt-3 text-lg font-medium text-sky-100">
          {goalTitle}
        </p>
        <p className="relative mt-5 text-4xl leading-none" aria-hidden>
          🥳 ✨ 🏆 💫 ⭐
        </p>
        <p className="relative mt-4 text-sm text-slate-400">
          Every daily task is checked off. Take a breath — you earned this moment.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="relative mt-8 w-full rounded-2xl bg-sky-600 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-500"
        >
          Exit
        </button>
      </div>
    </div>
  )
}
