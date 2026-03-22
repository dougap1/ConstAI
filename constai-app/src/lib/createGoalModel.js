import { buildScheduleFromFreeMinutes } from './schedule'
import { buildFallbackPlan } from './fallbackPlan'
import { normalizeGeminiPlanWithDeadline } from './planNormalize'

function parseWeekdayMin(v) {
  const n = Math.round(Number(v))
  if (Number.isNaN(n)) return 60
  return Math.min(24 * 60, Math.max(15, n))
}

function parseWeekendMin(v) {
  const n = Math.round(Number(v))
  if (Number.isNaN(n)) return 120
  return Math.min(24 * 60, Math.max(0, n))
}

export function buildIntakeForModel({
  title,
  whyItMatters,
  focusArea,
  deadline,
  weekdayFreeMinutes,
  weekendFreeMinutes,
}) {
  const schedule = buildScheduleFromFreeMinutes(
    weekdayFreeMinutes,
    weekendFreeMinutes,
  )

  return {
    title: title.trim(),
    whyItMatters: whyItMatters.trim(),
    focusArea: focusArea.trim(),
    deadline,
    weekdayFreeMinutes: parseWeekdayMin(weekdayFreeMinutes),
    weekendFreeMinutes: parseWeekendMin(weekendFreeMinutes),
    schedule,
  }
}

export function createGoalFromIntake(intake, geminiRaw = null) {
  const schedule = buildScheduleFromFreeMinutes(
    intake.weekdayFreeMinutes,
    intake.weekendFreeMinutes,
  )

  const intakeForGemini = buildIntakeForModel(intake)

  const normalized =
    geminiRaw != null
      ? normalizeGeminiPlanWithDeadline(geminiRaw, schedule, intake.deadline)
      : null

  const pack = normalized ?? buildFallbackPlan(intake, schedule)
  const planSource = normalized ? 'gemini' : 'fallback'

  return {
    id: crypto.randomUUID(),
    title: intake.title.trim(),
    whyItMatters: intake.whyItMatters.trim(),
    focusArea: intake.focusArea.trim(),
    deadline: intake.deadline,
    weekdayFreeMinutes: parseWeekdayMin(intake.weekdayFreeMinutes),
    weekendFreeMinutes: parseWeekendMin(intake.weekendFreeMinutes),
    schedule,
    intakeForGemini,
    cadence: pack.cadence,
    planMilestones: pack.planMilestones,
    motivationalNote: pack.motivationalNote,
    tasks: pack.tasks,
    planSource,
  }
}
