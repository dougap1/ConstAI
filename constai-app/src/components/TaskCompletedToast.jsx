/**
 * Lightweight acknowledgement when a task moves to done.
 * AI hook: swap copy for personalized praise from the model.
 */
export default function TaskCompletedToast({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[90] flex justify-center px-4">
      <div
        className="constai-toast-in pointer-events-auto w-full max-w-[380px] rounded-3xl border border-sky-400/45 bg-white/35 px-4 py-4 text-sm text-slate-900 shadow-lg shadow-sky-900/10 backdrop-blur-xl dark:border-sky-400/35 dark:bg-slate-950/40 dark:text-slate-50 dark:shadow-sky-950/20"
        role="status"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="max-w-full leading-snug">{message}</p>
          <button
            type="button"
            onClick={onDismiss}
            className="min-w-[5.5rem] rounded-2xl bg-sky-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-sky-600/25 transition hover:bg-sky-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
