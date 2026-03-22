/**
 * Lightweight acknowledgement when a task moves to done.
 * AI hook: swap copy for personalized praise from the model.
 */
export default function TaskCompletedToast({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4">
      <div
        className="constai-toast-in pointer-events-auto w-full max-w-[380px] rounded-2xl border border-sky-400/40 bg-slate-900/95 px-4 py-3 text-sm text-white shadow-xl shadow-sky-900/30 backdrop-blur-md dark:border-sky-500/30 dark:bg-slate-950/95"
        role="status"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="flex-1 text-center leading-snug sm:text-left">{message}</p>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
