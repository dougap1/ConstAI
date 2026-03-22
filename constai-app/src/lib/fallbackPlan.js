/**
 * Local heuristic plan when Gemini fails.
 */
import { getDaysUntilDeadline } from './milestones'
import { getPlannerWeekCount } from './plannerMilestones'
import {
  getMaxWindowMinutesFromSchedule,
  totalWeekdayMinutesFromSchedule,
} from './schedule'
import { assignMissingScheduledDates } from './taskDates'

const WEEK_TEMPLATES = [
  {
    summary: 'Orient and scope',
    beats: [
      'Clarify the smallest “done” slice for this goal.',
      'Block time before the week fills up.',
    ],
  },
  {
    summary: 'Build momentum',
    beats: [
      'Tackle the riskiest unknown first.',
      'Ship one tangible artifact.',
    ],
  },
  {
    summary: 'Sustain',
    beats: [
      'Light session if energy is low.',
      'Short retro: what to repeat.',
    ],
  },
  {
    summary: 'Land',
    beats: [
      'Verify against definition of done.',
      'Capture learnings.',
    ],
  },
]

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

export function buildFallbackPlan(intake, schedule) {
  const days = getDaysUntilDeadline(intake.deadline)
  const maxWin = getMaxWindowMinutesFromSchedule(schedule)
  const weekdayMins = totalWeekdayMinutesFromSchedule(schedule)

  const plannerWeekCount = getPlannerWeekCount(intake.deadline)
  const estimatedWeeks = clamp(Math.ceil(days / 7), 1, 24)
  const hasLongHorizon = days > 21
  const hasShortHorizon = days <= 14

  let sessionsPerWeek = 4
  let scheduleType = 'several_days_per_week'
  let assignedWeekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

  if (hasShortHorizon) {
    sessionsPerWeek = clamp(Math.ceil(days / 2), 2, 5)
    scheduleType = 'flex_blocks'
  } else if (hasLongHorizon) {
    const availSignal = weekdayMins > 180 ? 1 : weekdayMins > 90 ? 0 : -1
    sessionsPerWeek = clamp(3 + availSignal, 2, 5)
    scheduleType = 'milestone_based'
    if (weekdayMins < 60) {
      assignedWeekdayNames = ['Sat', 'Sun', 'Wed']
      scheduleType = 'mixed'
    }
  } else {
    sessionsPerWeek = clamp(Math.round(days / estimatedWeeks / 2), 2, 5)
  }

  const sessionLengthMinutes = clamp(
    Math.min(maxWin, Math.round(maxWin * 0.85)),
    20,
    maxWin,
  )

  const restN = clamp(7 - sessionsPerWeek, 1, 5)
  const recommendedRestDays = [
    'At least one full rest day per week.',
    `${restN} lighter or off days when possible.`,
  ]

  const reasoningSummary = `Offline plan: ~${sessionsPerWeek} sessions/week on ${assignedWeekdayNames.join(', ')} for ~${estimatedWeeks} week(s). Max block ~${maxWin} min. Adjust after your first week.`

  const planMilestones = Array.from({ length: plannerWeekCount }, (_, wi) => {
    const tmpl = WEEK_TEMPLATES[wi % WEEK_TEMPLATES.length]
    return {
      id: `fb-w${wi + 1}`,
      plannerWeekIndex: wi,
      weekLabel: `Week ${wi + 1}`,
      summary: `${tmpl.summary} — steps toward “${(intake.title || 'your goal').slice(0, 80)}”.`,
      beats: tmpl.beats.map((label, bi) => ({
        id: `fb-w${wi + 1}-b${bi + 1}`,
        label,
      })),
    }
  })

  const taskSeeds = [
    { title: 'Define “done” in one paragraph', tip: 'Write it in under 5 minutes.' },
    { title: 'Schedule your next two sessions', tip: 'Put them on the calendar now.' },
    { title: 'Ship one small visible win', tip: 'Smallest thing a friend could notice.' },
    { title: 'Retro: what to repeat', tip: 'Two bullets: keep / change.' },
  ]

  let tasks = taskSeeds.map((row, i) => ({
    id: crypto.randomUUID(),
    title: row.title,
    done: false,
    allottedMinutes: sessionLengthMinutes,
    durationMinutes: sessionLengthMinutes,
    week: `Week ${(i % plannerWeekCount) + 1}`,
    sessionLabel: `Session ${i + 1}`,
    tip: row.tip,
  }))

  tasks = assignMissingScheduledDates(
    tasks,
    intake.deadline,
    assignedWeekdayNames,
  )

  const motivationalNote =
    intake.whyItMatters?.trim() ||
    'Steady beats heroic sprints — pick a cadence you can repeat.'

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
