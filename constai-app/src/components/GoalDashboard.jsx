import { useMemo, useState } from 'react'
import ProgressBar from './ProgressBar'
import DayTasksModal from './DayTasksModal'
import { buildPlannerWeeks, todayDateKey } from '../lib/calendar'

function humanizeScheduleType(type) {
  if (!type || typeof type !== 'string') return 'Custom'
  return type.replace(/_/g, ' ')
}

function aggregateTasksForDate(allGoals, dateKey) {
  const out = []
  for (const g of allGoals) {
    for (const t of g.tasks || []) {
      if (t.scheduledDate === dateKey) {
        out.push({ goalId: g.id, goalTitle: g.title, task: t })
      }
    }
  }
  out.sort((a, b) => {
    if (a.task.done !== b.task.done) return a.task.done ? 1 : -1
    return a.task.title.localeCompare(b.task.title)
  })
  return out
}

function FreeTimeSummary({ weekdayFreeMinutes, weekendFreeMinutes }) {
  return (
    <p className="text-xs text-slate-600 dark:text-slate-400">
      Free time · Weekday: {weekdayFreeMinutes ?? '—'} min · Weekend:{' '}
      {weekendFreeMinutes ?? '—'} min / day
    </p>
  )
}

function RecommendedCadenceSection({ cadence }) {
  if (!cadence) return null
  const days =
    cadence.assignedWeekdayNames?.length > 0
      ? cadence.assignedWeekdayNames.join(', ')
      : '—'
  return (
    <section className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm dark:border-emerald-900/40 dark:bg-emerald-950/25">
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
        Plan
      </p>
      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
        ~{cadence.sessionsPerWeek}× / week · ~{cadence.estimatedWeeks} wk · ~
        {cadence.sessionLengthMinutes} min
      </p>
      <p className="mt-1 text-xs text-emerald-900/90 dark:text-emerald-200/80">
        {humanizeScheduleType(cadence.scheduleType)} · Work days: {days}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
        {cadence.reasoningSummary}
      </p>
      {cadence.recommendedRestDays?.length ? (
        <ul className="mt-2 list-inside list-disc text-xs text-slate-700 dark:text-slate-300">
          {cadence.recommendedRestDays.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function WeekMilestoneInSchedule({ milestone }) {
  if (!milestone) return null
  return (
    <div className="border-t border-slate-200/70 bg-sky-50/40 px-4 py-3 dark:border-slate-700/70 dark:bg-sky-950/15">
      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-400">
        Milestone · {milestone.weekLabel || 'This week'}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
        {milestone.summary}
      </p>
      {(milestone.beats || []).length ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
          {(milestone.beats || []).map((b) => (
            <li key={b.id}>→ {b.label}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default function GoalDashboard({
  goal,
  allGoals,
  onStartTaskTimer,
  onBack,
  onRequestRemoveGoal,
}) {
  const [modalDateKey, setModalDateKey] = useState(null)

  const weeks = useMemo(
    () => buildPlannerWeeks(goal.deadline),
    [goal.deadline],
  )

  const today = todayDateKey()
  const done = goal.tasks.filter((t) => t.done).length
  const pct =
    goal.tasks.length === 0 ? 0 : (done / goal.tasks.length) * 100

  const modalEntries = useMemo(
    () =>
      modalDateKey ? aggregateTasksForDate(allGoals, modalDateKey) : [],
    [allGoals, modalDateKey],
  )

  const modalLabel = useMemo(() => {
    if (!modalDateKey) return ''
    for (const w of weeks) {
      const d = w.days.find((x) => x.dateKey === modalDateKey)
      if (d) return d.label
    }
    return modalDateKey
  }, [modalDateKey, weeks])

  function openDay(dateKey) {
    setModalDateKey(dateKey)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800/80"
        >
          <span aria-hidden>←</span> All goals
        </button>
        {onRequestRemoveGoal ? (
          <button
            type="button"
            onClick={onRequestRemoveGoal}
            className="rounded-full border border-rose-200/90 bg-rose-50/80 px-4 py-2 text-sm font-medium text-rose-800 backdrop-blur hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950/60"
          >
            Remove goal
          </button>
        ) : null}
      </div>

      <header className="space-y-1">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {goal.title}
        </h2>
        {goal.focusArea ? (
          <p className="text-sm text-sky-700 dark:text-sky-300">{goal.focusArea}</p>
        ) : null}
        <FreeTimeSummary
          weekdayFreeMinutes={goal.weekdayFreeMinutes}
          weekendFreeMinutes={goal.weekendFreeMinutes}
        />
      </header>

      <aside className="rounded-2xl border border-slate-200/80 bg-sky-50/50 p-4 text-sm dark:border-slate-700/80 dark:bg-sky-950/20">
        <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">
          Why
        </p>
        <p className="mt-1 text-slate-800 dark:text-slate-200">{goal.whyItMatters}</p>
        {goal.motivationalNote ? (
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            {goal.motivationalNote}
          </p>
        ) : null}
      </aside>

      <RecommendedCadenceSection cadence={goal.cadence} />

      <ProgressBar value={pct} label="Progress" />

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Schedule
        </h3>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Each week shows your milestone, then days. Tap a day for tasks (all goals).
          Today is highlighted.
        </p>
        <div className="space-y-3">
          {weeks.map((w, wi) => (
            <details
              key={w.id}
              className="group rounded-2xl border border-slate-200/80 bg-white/70 dark:border-slate-700/80 dark:bg-slate-900/50"
              open={wi === 0}
            >
              <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-slate-900 marker:content-none dark:text-white [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  {w.label}
                  <span className="text-xs font-normal text-slate-500">
                    {w.dayCount} day{w.dayCount === 1 ? '' : 's'}
                  </span>
                </span>
              </summary>
              <WeekMilestoneInSchedule milestone={goal.planMilestones?.[wi]} />
              <div className="flex flex-wrap gap-2 border-t border-slate-200/70 px-3 pb-3 pt-2 dark:border-slate-700/70">
                {w.days.map((d) => {
                  const count = aggregateTasksForDate(allGoals, d.dateKey).length
                  const isToday = d.dateKey === today
                  return (
                    <button
                      key={d.dateKey}
                      type="button"
                      onClick={() => openDay(d.dateKey)}
                      className={`min-w-[4.5rem] rounded-xl border px-2 py-2 text-left text-xs transition ${
                        isToday
                          ? 'border-red-500 bg-red-50 font-semibold text-red-900 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100'
                          : 'border-slate-200 bg-white/90 text-slate-800 hover:border-sky-400 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100'
                      } ${count === 0 ? 'opacity-50' : ''}`}
                    >
                      <span className="block">{d.weekdayShort}</span>
                      <span className="block text-[10px] opacity-80">{d.label}</span>
                      <span className="mt-1 block text-[10px] text-sky-600 dark:text-sky-400">
                        {count} task{count === 1 ? '' : 's'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      </section>

      {modalDateKey ? (
        <DayTasksModal
          dateKey={modalDateKey}
          dateLabel={modalLabel}
          goals={allGoals}
          entries={modalEntries}
          onClose={() => setModalDateKey(null)}
          onStartTimer={(goalId, task) => {
            setModalDateKey(null)
            onStartTaskTimer(goalId, task)
          }}
        />
      ) : null}
    </div>
  )
}
