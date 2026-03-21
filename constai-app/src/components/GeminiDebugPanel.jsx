/**
 * Stays visible until dismissed — for inspecting Gemini failures without a short toast timeout.
 */
export default function GeminiDebugPanel({ debug, onDismiss }) {
  if (!debug) return null

  const blob = [
    `[${debug.at}] ${debug.headline}`,
    '',
    debug.detail,
    debug.stack ? `\n--- Stack ---\n${debug.stack}` : '',
    debug.responsePreview
      ? `\n--- Response preview ---\n${debug.responsePreview}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(blob)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[95] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="alert"
    >
      <div className="flex w-full max-w-3xl flex-col rounded-2xl border border-amber-400/50 bg-amber-950/95 text-amber-50 shadow-2xl shadow-amber-950/40 backdrop-blur-md dark:border-amber-500/40 dark:bg-amber-950/98">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/25 px-4 py-2.5">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-200/90">
            Gemini debug (stays until you dismiss)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
            >
              Copy all
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-white/15"
            >
              Dismiss
            </button>
          </div>
        </div>
        <div className="max-h-[min(50vh,28rem)] space-y-3 overflow-y-auto px-4 py-3">
          <p className="text-sm font-semibold leading-snug text-white">
            {debug.headline}
          </p>
          <p className="text-sm leading-relaxed text-amber-100/95">{debug.detail}</p>
          {debug.stack ? (
            <pre className="overflow-x-auto rounded-xl bg-black/35 p-3 font-mono text-[11px] leading-relaxed text-amber-100/90 whitespace-pre-wrap break-words">
              {debug.stack}
            </pre>
          ) : null}
          {debug.responsePreview ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">
                Model JSON (preview / truncated)
              </p>
              <pre className="max-h-48 overflow-auto rounded-xl bg-black/35 p-3 font-mono text-[11px] leading-relaxed text-amber-100/85 whitespace-pre-wrap break-words">
                {debug.responsePreview}
              </pre>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
