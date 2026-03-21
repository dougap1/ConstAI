/**
 * Lightweight acknowledgement when a task moves to done.
 * AI hook: swap copy for personalized praise from the model.
 */
export default function TaskCompletedToast({ message, onDismiss }) {
  if (!message) return null
  return (
    <div
      className="constai-toast-in fixed bottom-6 left-1/2 z-[90] w-[min(100%-2rem,380px)] -translate-x-1/2 rounded-2xl border border-sky-400/40 bg-slate-900/95 px-4 py-3 text-sm text-white shadow-xl shadow-sky-900/30 backdrop-blur-md dark:border-sky-500/30 dark:bg-slate-950/95"
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-left leading-snug">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
        >
          OK
        </button>
      </div>
    </div>
  )
}
