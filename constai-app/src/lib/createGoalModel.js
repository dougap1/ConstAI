import {
  dummyTasks,
  dummyMotivationalNote,
} from '../data/seedGoal'
import { buildMilestonePlan } from './milestones'
import { buildDefaultSchedule, computeAllottedMinutesPerTask } from './schedule'

/**
 * Assembles a goal record from the creation wizard.
 * Gemini hook: send `intakeForGemini` in the body of your generate/enrich call.
 */
export function createGoalFromIntake({
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

  const intakeForGemini = {
    title: title.trim(),
    whyItMatters: whyItMatters.trim(),
    focusArea: focusArea.trim(),
    deadline,
    weekdayAvailability: weekdayAvailability.trim(),
    weekendAvailability: weekendAvailability.trim(),
    toneStyle,
    schedule,
  }

  const milestonePlan = buildMilestonePlan(deadline, toneStyle)

  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    whyItMatters: whyItMatters.trim(),
    focusArea: focusArea.trim(),
    deadline,
    weekdayAvailability: weekdayAvailability.trim(),
    weekendAvailability: weekendAvailability.trim(),
    toneStyle,
    schedule,
    milestonePlan,
    /** Raw payload for future Gemini POST — do not remove when wiring API */
    intakeForGemini,
    motivationalNote:
      whyItMatters.trim() || dummyMotivationalNote(),
    tasks: (() => {
      const base = dummyTasks()
      const per = computeAllottedMinutesPerTask(schedule, base.length)
      return base.map((t) => ({ ...t, allottedMinutes: per }))
    })(),
  }
}
