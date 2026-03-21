import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildFocusSessionPlan,
  getActiveSlice,
} from '../lib/sessionPlan'

const R = 44
const CX = 50
const CY = 50
const CIRC = 2 * Math.PI * R

function describeArc(a0, a1) {
  const x0 = CX + R * Math.cos(a0)
  const y0 = CY + R * Math.sin(a0)
  const x1 = CX + R * Math.cos(a1)
  const y1 = CY + R * Math.sin(a1)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1}`
}

function formatMmSs(totalSec) {
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function SegmentTrack({ segments, totalSessionSec }) {
  const paths = segments.reduce(
    (acc, seg, i) => {
      const span = (seg.durationSec / totalSessionSec) * 2 * Math.PI
      const t0 = acc.theta
      const t1 = acc.theta + span
      const stroke =
        seg.type === 'break'
          ? 'rgba(251, 191, 36, 0.55)'
          : 'rgba(56, 189, 248, 0.5)'
      acc.items.push(
        <path
          key={i}
          d={describeArc(t0, t1)}
          fill="none"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="butt"
        />,
      )
      return { theta: t1, items: acc.items }
    },
    { theta: -Math.PI / 2, items: [] },
  ).items

  return <g aria-hidden>{paths}</g>
}

/**
 * Full-screen timer: fixed duration from schedule (no user duration pick).
 * >60m work → random 10m break in the middle third of work time.
 */
export default function FocusTimerOverlay({
  goalTitle,
  taskTitle,
  taskId,
  workMinutesTotal,
  onClose,
  onSessionComplete,
}) {
  const plan = useMemo(
    () => buildFocusSessionPlan(workMinutesTotal),
    [workMinutesTotal],
  )
  const { segments, totalSessionSec } = plan

  const [phase, setPhase] = useState('ready') // ready | running | done
  const [elapsed, setElapsed] = useState(0)
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

  function startRun() {
    setPhase('running')
    setElapsed(0)
    clearTick()
    tickRef.current = window.setInterval(() => {
      setElapsed((e) => {
        const next = Math.min(e + 1, totalSessionSec)
        if (next >= totalSessionSec && totalSessionSec > 0) {
          clearTick()
          window.setTimeout(() => setPhase('done'), 0)
        }
        return next
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

  const active =
    phase === 'running'
      ? getActiveSlice(segments, elapsed)
      : null
  const displayRemaining =
    phase === 'running' && active
      ? Math.max(0, Math.ceil(active.remainingInSegment))
      : 0

  const progressPct =
    totalSessionSec <= 0
      ? 0
      : Math.min(100, (elapsed / totalSessionSec) * 100)

  const breakNote = segments.some((s) => s.type === 'break')

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
          <p className="mt-2 max-w-md text-xs text-slate-500">
            {workMinutesTotal} min focus budget today · ring shows focus (sky)
            and break (gold)
            {breakNote ? ' · one 10 min break mid-session' : ''}
          </p>

          {phase === 'ready' ? (
            <div className="constai-animate-in mt-10 max-w-sm space-y-6">
              <ul className="space-y-2 text-left text-sm text-slate-300">
                {segments.map((s, i) => (
                  <li key={i} className="flex justify-between gap-4 border-b border-white/5 py-2">
                    <span>
                      {s.type === 'break' ? '☕ Break' : '▶ Focus'}
                    </span>
                    <span className="tabular-nums text-slate-400">
                      {Math.round(s.durationSec / 60)} min
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={startRun}
                className="w-full rounded-2xl bg-sky-600 py-4 text-base font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 active:scale-[0.99]"
              >
                Start session
              </button>
              <p className="text-xs text-slate-500">
                Duration is set from your schedule — you can’t change it here.
              </p>
            </div>
          ) : null}

          {phase === 'running' ? (
            <div className="constai-scale-in mt-8 flex flex-col items-center">
              <p className="mb-2 text-sm font-medium text-amber-200/90">
                {active?.segment?.type === 'break'
                  ? 'Break — stretch, water, look away'
                  : 'Deep focus'}
              </p>
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
                    cx={CX}
                    cy={CY}
                    r={R}
                    fill="none"
                    className="text-white/10"
                    stroke="currentColor"
                    strokeWidth="6"
                  />
                  <SegmentTrack
                    segments={segments}
                    totalSessionSec={totalSessionSec}
                  />
                  <circle
                    cx={CX}
                    cy={CY}
                    r={R}
                    fill="none"
                    className="text-sky-300"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - progressPct / 100)}
                  />
                </svg>
                <span className="font-display text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl">
                  {formatMmSs(displayRemaining)}
                </span>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Segment {active ? active.index + 1 : 0} of {segments.length}
              </p>
              <button
                type="button"
                onClick={() => {
                  clearTick()
                  onClose?.()
                }}
                className="mt-6 text-sm text-slate-400 underline-offset-2 hover:text-white hover:underline"
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
