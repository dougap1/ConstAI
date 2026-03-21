import {
  dummyTasks,
  dummyMotivationalNote,
} from '../data/seedGoal'
import { buildMilestonePlan } from './milestones'
import { buildDefaultSchedule, computeAllottedMinutesPerTask } from './schedule'

export function buildIntakeForModel({
  title,
  whyItMatters,
  focusArea,
  deadline,
  weekdayAvailability,
  weekendAvailability,
  toneStyle,
}) {
  const schedule = buildDefaultSchedule({
    weekdayAvailability,
    weekendAvailability,
  })

  return {
    title: title.trim(),
    whyItMatters: whyItMatters.trim(),
    focusArea: focusArea.trim(),
    deadline,
    weekdayAvailability: weekdayAvailability.trim(),
    weekendAvailability: weekendAvailability.trim(),
    toneStyle,
    schedule,
  }
}

function mapTasksFromGeminiTitles(titles, schedule) {
  const cleaned = titles
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter(Boolean)
  if (cleaned.length < 3) return null
  const capped = cleaned.slice(0, 10)
  const per = computeAllottedMinutesPerTask(schedule, capped.length)
  return capped.map((taskTitle) => ({
    id: crypto.randomUUID(),
    title: taskTitle,
    done: false,
    allottedMinutes: per,
  }))
}

function normalizeMilestoneFromGemini(plan) {
  if (!plan || typeof plan !== 'object') return null
  const mode =
    plan.mode === 'daily' || plan.mode === 'weekly_nested' ? plan.mode : null
  if (!mode) return null
  const sectionTitle =
    typeof plan.sectionTitle === 'string' ? plan.sectionTitle.trim() : ''
  const subtitle =
    typeof plan.subtitle === 'string' ? plan.subtitle.trim() : ''
  if (!sectionTitle || !subtitle) return null

  if (mode === 'daily') {
    const items = Array.isArray(plan.items) ? plan.items : []
    const normalized = items
      .map((it, i) => {
        const dayLabel =
          typeof it.dayLabel === 'string' ? it.dayLabel.trim() : ''
        const label = typeof it.label === 'string' ? it.label.trim() : ''
        if (!label) return null
        return {
          id: `d-${i + 1}`,
          dayLabel: dayLabel || `Day ${i + 1}`,
          label,
        }
      })
      .filter(Boolean)
    if (normalized.length < 2) return null
    return { mode: 'daily', sectionTitle, subtitle, items: normalized }
  }

  const weeksRaw = Array.isArray(plan.weeks) ? plan.weeks : []
  const weeks = weeksRaw
    .map((w, wi) => {
      const week = typeof w.week === 'string' ? w.week.trim() : ''
      const label = typeof w.label === 'string' ? w.label.trim() : ''
      const dailyRaw = Array.isArray(w.daily) ? w.daily : []
      const daily = dailyRaw
        .map((d, di) => {
          const lbl =
            typeof d?.label === 'string' ? d.label.trim() : ''
          if (!lbl) return null
          return { id: `w${wi + 1}-${di + 1}`, label: lbl }
        })
        .filter(Boolean)
      if (!label || daily.length < 1) return null
      return {
        id: `w${wi + 1}`,
        week: week || `Week ${wi + 1}`,
        label,
        daily,
      }
    })
    .filter(Boolean)
  if (weeks.length < 1) return null
  return { mode: 'weekly_nested', sectionTitle, subtitle, weeks }
}

/**
 * Validates Gemini JSON (structured output) and returns tasks + milestone shape for the app.
 */
export function normalizeGeminiGoalPlan(raw, schedule) {
  if (!raw || typeof raw !== 'object') return null
  const motivationalNote =
    typeof raw.motivationalNote === 'string'
      ? raw.motivationalNote.trim()
      : ''
  if (!motivationalNote) return null

  const tasksRaw = Array.isArray(raw.tasks) ? raw.tasks : []
  const titles = tasksRaw
    .map((t) => (typeof t?.title === 'string' ? t.title.trim() : ''))
    .filter(Boolean)

  const tasks = mapTasksFromGeminiTitles(titles, schedule)
  if (!tasks) return null

  const milestonePlan = normalizeMilestoneFromGemini(raw.milestonePlan)
  if (!milestonePlan) return null

  return { motivationalNote, tasks, milestonePlan }
}

/**
 * Assembles a goal record from the creation wizard.
 * Pass `geminiRaw` when Gemini returned JSON; otherwise local dummy milestones/tasks are used.
 */
export function createGoalFromIntake(intake, geminiRaw = null) {
  const schedule = buildDefaultSchedule({
    weekdayAvailability: intake.weekdayAvailability,
    weekendAvailability: intake.weekendAvailability,
  })

  const intakeForGemini = buildIntakeForModel(intake)
  const normalized =
    geminiRaw != null ? normalizeGeminiGoalPlan(geminiRaw, schedule) : null

  const milestonePlan =
    normalized?.milestonePlan ??
    buildMilestonePlan(intake.deadline, intake.toneStyle)

  const tasks = normalized?.tasks
    ? normalized.tasks
    : (() => {
        const base = dummyTasks()
        const per = computeAllottedMinutesPerTask(schedule, base.length)
        return base.map((t) => ({ ...t, allottedMinutes: per }))
      })()

  const motivationalNote = normalized?.motivationalNote
    ? normalized.motivationalNote
    : intake.whyItMatters.trim() || dummyMotivationalNote()

  return {
    id: crypto.randomUUID(),
    title: intake.title.trim(),
    whyItMatters: intake.whyItMatters.trim(),
    focusArea: intake.focusArea.trim(),
    deadline: intake.deadline,
    weekdayAvailability: intake.weekdayAvailability.trim(),
    weekendAvailability: intake.weekendAvailability.trim(),
    toneStyle: intake.toneStyle,
    schedule,
    milestonePlan,
    intakeForGemini,
    motivationalNote,
    tasks,
    planSource: normalized ? 'gemini' : 'fallback',
  }
}
