import {
  dummyMilestones,
  dummyTasks,
  dummyMotivationalNote,
} from '../data/seedGoal'
import { buildDefaultSchedule } from './schedule'

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
    /** Raw payload for future Gemini POST — do not remove when wiring API */
    intakeForGemini,
    motivationalNote:
      whyItMatters.trim() || dummyMotivationalNote(),
    milestones: dummyMilestones(),
    tasks: dummyTasks(),
  }
}
