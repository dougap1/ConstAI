/**
 * Validates Gemini structured plan JSON and applies guardrails.
 */
import { getDaysUntilDeadline } from './milestones'
import {
  alignMilestonesToPlannerWeeks,
  getPlannerWeekCount,
} from './plannerMilestones'
import { getMaxWindowMinutesFromSchedule } from './schedule'
import {
  assignMissingScheduledDates,
  normalizeWeekdayToken,
} from './taskDates'

const SCHEDULE_TYPES = new Set([
  'daily',
  'weekdays_only',
  'weekends_only',
  'several_days_per_week',
  'milestone_based',
  'flex_blocks',
  'mixed',
  'custom',
])

function clamp(n, lo, hi) {
  if (typeof n !== 'number' || Number.isNaN(n)) return lo
  return Math.min(hi, Math.max(lo, Math.round(n)))
}

function asNonEmptyString(v) {
  if (typeof v !== 'string') return ''
  const t = v.trim()
  return t
}

function parseDateKey(s) {
  if (typeof s !== 'string') return null
  const m = s.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m)) return null
  const d = new Date(m + 'T12:00:00')
  return Number.isNaN(d.getTime()) ? null : m
}

/**
 * @param {string} deadlineIso
 * @returns {null | { cadence, planMilestones, tasks, motivationalNote }}
 */
export function normalizeGeminiPlan(raw, schedule, daysUntil, deadlineIso) {
  if (!raw || typeof raw !== 'object') return null

  const motivationalNote =
    asNonEmptyString(raw.motivationalNote) ||
    asNonEmptyString(raw.reasoningSummary)
  if (!motivationalNote) return null

  const reasoningSummary = asNonEmptyString(raw.reasoningSummary)
  if (!reasoningSummary) return null

  const maxWin = getMaxWindowMinutesFromSchedule(schedule)
  const maxWeeks = clamp(Math.ceil((daysUntil || 30) / 7) + 2, 1, 52)

  let scheduleType = asNonEmptyString(raw.scheduleType) || 'several_days_per_week'
  if (!SCHEDULE_TYPES.has(scheduleType)) scheduleType = 'custom'

  const horizonWeeks = Math.max(1, Math.ceil((daysUntil || 30) / 7))
  let sessionsPerWeek = clamp(Number(raw.sessionsPerWeek), 1, 7)
  let estimatedWeeks = clamp(Number(raw.estimatedWeeks), 1, maxWeeks)
  estimatedWeeks = Math.min(estimatedWeeks, horizonWeeks + 1)
  let sessionLengthMinutes = clamp(Number(raw.sessionLengthMinutes), 15, maxWin)

  if (sessionLengthMinutes > maxWin) sessionLengthMinutes = maxWin

  const rawNames = Array.isArray(raw.assignedWeekdayNames)
    ? raw.assignedWeekdayNames
    : []
  let assignedWeekdayNames = [
    ...new Set(
      rawNames
        .map((n) => normalizeWeekdayToken(String(n)))
        .filter(Boolean),
    ),
  ]
  if (scheduleType === 'weekends_only') {
    assignedWeekdayNames = ['Sat', 'Sun']
  } else if (scheduleType === 'weekdays_only') {
    assignedWeekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  }
  if (assignedWeekdayNames.length < 1) {
    assignedWeekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  }

  const restRaw = Array.isArray(raw.recommendedRestDays)
    ? raw.recommendedRestDays
    : []
  let recommendedRestDays = restRaw
    .map((s) => asNonEmptyString(s))
    .filter(Boolean)
    .slice(0, 10)
  if (recommendedRestDays.length === 0) {
    recommendedRestDays = [
      'Include at least one lighter or off day each week when possible.',
    ]
  }

  const milestonesRaw = Array.isArray(raw.milestones) ? raw.milestones : []
  const plannerWeekCount = getPlannerWeekCount(deadlineIso)

  const planMilestonesDraft = milestonesRaw
    .map((m, mi) => {
      const weekLabel =
        asNonEmptyString(m?.weekLabel) || asNonEmptyString(m?.week) || `Week ${mi + 1}`
      const summary =
        asNonEmptyString(m?.summary) || asNonEmptyString(m?.label) || 'Focus for this week'
      const beatsSrc = Array.isArray(m?.beats)
        ? m.beats
        : Array.isArray(m?.daily)
          ? m.daily.map((d) =>
              typeof d === 'string' ? { label: d } : d,
            )
          : []
      const beats = beatsSrc
        .map((b, bi) => {
          const label =
            typeof b === 'string'
              ? b.trim()
              : asNonEmptyString(b?.label)
          if (!label) return null
          return { id: `m-${mi + 1}-b${bi + 1}`, label }
        })
        .filter(Boolean)
      if (beats.length < 1) return null
      let plannerWeekIndex = null
      const pwi = Math.round(Number(m?.plannerWeekIndex))
      if (!Number.isNaN(pwi)) {
        if (pwi >= 1 && pwi <= plannerWeekCount) {
          plannerWeekIndex = pwi - 1
        } else {
          plannerWeekIndex = clamp(pwi, 0, plannerWeekCount - 1)
        }
      }
      return {
        id: `m-${mi + 1}`,
        weekLabel,
        summary,
        beats,
        ...(plannerWeekIndex != null ? { plannerWeekIndex } : {}),
      }
    })
    .filter(Boolean)

  const planMilestones = alignMilestonesToPlannerWeeks(
    planMilestonesDraft,
    plannerWeekCount,
  )

  const tasksRaw = Array.isArray(raw.tasks) ? raw.tasks : []
  let tasks = tasksRaw
    .map((t) => {
      const title = asNonEmptyString(t?.title)
      if (!title) return null
      const week = asNonEmptyString(t?.week) || 'Week 1'
      const sessionLabel =
        asNonEmptyString(t?.sessionLabel) ||
        asNonEmptyString(t?.dayLabel) ||
        'Session'
      const dm = clamp(Number(t?.durationMinutes), 15, maxWin)
      const durationMinutes = dm > maxWin ? maxWin : dm
      const scheduledDate = parseDateKey(t?.scheduledDate)
      const tip = asNonEmptyString(t?.tip) || ''
      return {
        id: crypto.randomUUID(),
        title,
        done: Boolean(t?.completed),
        allottedMinutes: durationMinutes,
        durationMinutes,
        week,
        sessionLabel,
        dayLabel: asNonEmptyString(t?.dayLabel) || undefined,
        scheduledDate: scheduledDate || undefined,
        tip,
      }
    })
    .filter(Boolean)

  if (tasks.length < 2) return null

  tasks = assignMissingScheduledDates(
    tasks,
    deadlineIso,
    assignedWeekdayNames,
  )

  const cadence = {
    scheduleType,
    sessionsPerWeek,
    estimatedWeeks,
    sessionLengthMinutes,
    recommendedRestDays,
    reasoningSummary,
    assignedWeekdayNames,
  }

  return { cadence, planMilestones, tasks, motivationalNote }
}

export function normalizeGeminiPlanWithDeadline(raw, schedule, deadlineIso) {
  const days = getDaysUntilDeadline(deadlineIso)
  return normalizeGeminiPlan(raw, schedule, days, deadlineIso)
}
