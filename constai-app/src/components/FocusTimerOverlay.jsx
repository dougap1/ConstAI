import { useCallback, useEffect, useRef, useState } from 'react'

const PRESETS = [
  { label: '25 min', sec: 25 * 60 },
  { label: '15 min', sec: 15 * 60 },
  { label: '5 min', sec: 5 * 60 },
]

function formatMmSs(totalSec) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Full-screen focus timer. Mount only while active; parent unmount clears state.
 * On natural completion, parent marks the task done for today.
 */
export default function FocusTimerOverlay({
  goalTitle,
  taskTitle,
  taskId,
  initialSeconds = PRESETS[0].sec,
  onClose,
  onSessionComplete,
}) {
  const [phase, setPhase] = useState('pick') // pick | running | done
  const [durationSec, setDurationSec] = useState(initialSeconds)
  const [remaining, setRemaining] = useState(initialSeconds)
  const tickRef = useRef(null)
  const completionSentRef = useRef(false)

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearTick()
  }, [clearTick])

  function startRun(sec) {
    setDurationSec(sec)
    setRemaining(sec)
    setPhase('running')
    clearTick()
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearTick()
          setPhase('done')
          return 0
        }
        return r - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (phase !== 'done' || !taskId) return
    if (completionSentRef.current) return
    completionSentRef.current = true
    onSessionComplete?.(taskId)
    const t = window.setTimeout(() => {
      onClose?.()
    }, 2800)
    return () => window.clearTimeout(t)
  }, [phase, taskId, onSessionComplete, onClose])

  const progress =
    durationSec <= 0
      ? 0
      : Math.min(100, ((durationSec - remaining) / durationSec) * 100)

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 text-white backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-timer-title"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="constai-timer-aurora absolute -left-1/4 top-0 h-[60vh] w-[80vw] rounded-full bg-sky-500/20 blur-[100px]" />
        <div className="constai-timer-aurora absolute -right-1/4 bottom-0 h-[50vh] w-[70vw] rounded-full bg-cyan-400/15 blur-[90px] [animation-delay:-4s]" />
      </div>

      <div className="relative flex flex-1 flex-col px-6 py-8 sm:px-10">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              clearTick()
              onClose?.()
            }}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p
            id="focus-timer-title"
            className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300/90"
          >
            Focus session
          </p>
          <p className="mt-2 max-w-md text-sm text-slate-400">{goalTitle}</p>
          <p className="mt-1 font-display text-lg font-medium text-white">
            {taskTitle}
          </p>

          {phase === 'pick' ? (
            <div className="constai-animate-in mt-12 space-y-6">
              <p className="text-sm text-slate-400">Choose a duration</p>
              <div className="flex flex-wrap justify-center gap-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.sec}
                    type="button"
                    onClick={() => startRun(p.sec)}
                    className="rounded-2xl border border-sky-500/40 bg-sky-500/10 px-6 py-3 text-sm font-semibold text-sky-100 transition hover:scale-105 hover:border-sky-400/60 hover:bg-sky-500/20"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {phase === 'running' ? (
            <div className="constai-scale-in mt-10 flex flex-col items-center">
              <div
                className="relative grid size-72 place-items-center sm:size-80"
                aria-live="polite"
              >
                <svg
                  className="absolute size-full -rotate-90"
                  viewBox="0 0 100 100"
                  aria-hidden
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    className="text-white/10"
                    stroke="currentColor"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    className="text-sky-400 transition-[stroke-dashoffset] duration-1000 ease-linear"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 44}
                    strokeDashoffset={
                      2 * Math.PI * 44 * (1 - progress / 100)
                    }
                  />
                </svg>
                <span className="font-display text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl">
                  {formatMmSs(remaining)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearTick()
                  onClose?.()
                }}
                className="mt-8 text-sm text-slate-400 underline-offset-2 hover:text-white hover:underline"
              >
                End without marking complete
              </button>
            </div>
          ) : null}

          {phase === 'done' ? (
            <div className="constai-celebrate mt-12 space-y-4">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-cyan-400 text-3xl shadow-lg shadow-sky-500/40">
                ✓
              </div>
              <p className="font-display text-2xl font-semibold text-white">
                Session complete
              </p>
              <p className="max-w-sm text-sm text-slate-400">
                This task is marked complete for today.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
