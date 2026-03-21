import { useMemo } from 'react'
import ProgressBar from './ProgressBar'
import TaskList from './TaskList'
import { buildMilestonePlan } from '../lib/milestones'
import { formatScheduleWindowLine } from '../lib/schedule'

const toneHints = {
  strict:
    'Strict: rigorous scheduling to meet the deadline — or finish early when the scope allows.',
  calm: 'Breathe through the list — pace beats panic.',
  neutral: 'Steady rhythm. Adjust tone anytime.',
}

function SchedulePreview({ schedule }) {
  if (!schedule?.weekdays) return null
  const wd =
    schedule.weekdays.displayWindows?.length > 0
      ? schedule.weekdays.displayWindows
      : (schedule.weekdays.windows || []).map(formatScheduleWindowLine)
  const we =
    schedule.weekends?.displayWindows?.length > 0
      ? schedule.weekends.displayWindows
      : (schedule.weekends?.windows || []).map(formatScheduleWindowLine)

  return (
    <section className="constai-animate-in rounded-2xl border border-slate-200/80 bg-white/50 p-4 text-sm dark:border-slate-700/80 dark:bg-slate-900/40">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        Default schedule
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Times show <span className="font-medium">12-hour (AM/PM)</span> and{' '}
        <span className="font-medium">24-hour</span> so your input can be
        flexible.
      </p>
      <dl className="mt-3 space-y-3 text-xs text-slate-600 dark:text-slate-300">
        <div>
          <dt className="font-semibold text-sky-700 dark:text-sky-400">
            Weekdays ({schedule.weekdays.days?.join(' · ') ?? 'Mon–Fri'})
          </dt>
          <dd className="mt-1 space-y-1">
            {wd?.map((line, i) => (
              <p key={i} className="font-mono text-[11px] text-slate-700 dark:text-slate-200">
                {line}
              </p>
            )) ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-sky-700 dark:text-sky-400">
            Weekends ({schedule.weekends?.days?.join(' · ') ?? 'Sat–Sun'})
          </dt>
          <dd className="mt-1 space-y-1">
            {we?.map((line, i) => (
              <p key={i} className="font-mono text-[11px] text-slate-700 dark:text-slate-200">
                {line}
              </p>
            )) ?? '—'}
          </dd>
        </div>
      </dl>
    </section>
  )
}

function MilestoneSection({ plan }) {
  if (!plan) return null

  if (plan.mode === 'daily') {
    return (
      <section>
        <h3 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
          {plan.sectionTitle}
        </h3>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          {plan.subtitle}
        </p>
        <ol className="space-y-2">
          {plan.items.map((it, i) => (
            <li
              key={it.id}
              className="flex gap-3 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2.5 text-sm dark:border-slate-700/70 dark:bg-slate-900/40"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                {i + 1}
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                  {it.dayLabel}
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {it.label}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    )
  }

  return (
    <section>
      <h3 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {plan.sectionTitle}
      </h3>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        {plan.subtitle}
      </p>
      <div className="space-y-4">
        {plan.weeks.map((w, wi) => (
          <div
            key={w.id}
            className="rounded-2xl border border-slate-200/80 bg-white/50 p-4 dark:border-slate-700/80 dark:bg-slate-900/35"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                {wi + 1}
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                  {w.week}
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {w.label}
                </p>
              </div>
            </div>
            <div className="mt-3 border-t border-slate-200/70 pt-3 dark:border-slate-700/70">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Daily milestones inside this week
              </p>
              <ul className="mt-2 space-y-2">
                {w.daily.map((d) => (
                  <li
                    key={d.id}
                    className="flex gap-2 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span className="text-sky-500" aria-hidden>
                      →
                    </span>
                    <span>{d.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function GoalDashboard({
  goal,
  tone,
  onStartTaskTimer,
  onBack,
  onRequestRemoveGoal,
}) {
  const effectiveTone = goal.toneStyle ?? tone
  const done = goal.tasks.filter((t) => t.done).length
  const pct =
    goal.tasks.length === 0 ? 0 : (done / goal.tasks.length) * 100

  const milestonePlan = useMemo(() => {
    if (goal.milestonePlan) return goal.milestonePlan
    return buildMilestonePlan(goal.deadline, goal.toneStyle ?? 'neutral')
  }, [goal.milestonePlan, goal.deadline, goal.toneStyle])

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

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
          Dashboard
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {goal.title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {toneHints[effectiveTone] ?? toneHints.neutral}
        </p>
        {goal.focusArea ? (
          <p className="text-sm text-sky-700 dark:text-sky-300">
            Focus: {goal.focusArea}
          </p>
        ) : null}
      </header>

      <aside className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-sky-50/95 to-cyan-50/50 p-5 text-sm leading-relaxed text-slate-700 dark:border-slate-700/80 dark:from-sky-950/35 dark:to-slate-900/60 dark:text-slate-300">
        <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/90 dark:text-sky-300/90">
          Why it matters
        </p>
        <p className="mt-2">{goal.whyItMatters ?? goal.motivationalNote}</p>
      </aside>

      <SchedulePreview schedule={goal.schedule} />

      <MilestoneSection plan={milestonePlan} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Tasks
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Tasks complete <span className="font-medium">only</span> after a
            full timer session for that task — no manual checkboxes.
          </span>
        </div>
        <ProgressBar
          value={pct}
          tone={effectiveTone}
          label="Goal alignment"
        />
        <TaskList
          goal={goal}
          tasks={goal.tasks}
          tone={effectiveTone}
          onStartTaskTimer={onStartTaskTimer}
        />
      </section>
    </div>
  )
}
