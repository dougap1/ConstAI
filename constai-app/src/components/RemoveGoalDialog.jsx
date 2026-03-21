import { useState } from 'react'

/**
 * Removing a whole goal — reflective reason (tasks cannot be deleted individually).
 * AI hook: optional coaching follow-up from reason text.
 */
export default function RemoveGoalDialog({
  open,
  goalTitle,
  onCancel,
  onConfirm,
}) {
  const [reason, setReason] = useState('')

  if (!open) return null

  const canConfirm = reason.trim().length >= 3

  function closeWithoutRemove() {
    setReason('')
    onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-goal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={closeWithoutRemove}
        aria-label="Close dialog"
      />
      <div className="constai-animate-in relative z-10 w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h2
          id="remove-goal-title"
          className="font-display text-lg font-semibold text-slate-900 dark:text-white"
        >
          Remove goal?
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          You’re removing the entire goal{' '}
          <span className="font-medium text-slate-800 dark:text-slate-200">
            “{goalTitle}”
          </span>
          . Individual tasks can’t be deleted — only completed through the
          timer — so removing the goal is how you drop the whole plan.
        </p>
        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Why are you removing this goal?
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="A short honest reason helps you learn what to try next…"
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </label>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={closeWithoutRemove}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Keep goal
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              const r = reason.trim()
              setReason('')
              onConfirm(r)
            }}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Remove goal
          </button>
        </div>
      </div>
    </div>
  )
}
