/**
 * Persist goals in localStorage with light schema migration.
 */
import { assignMissingScheduledDates } from './taskDates'
import {
  alignMilestonesToPlannerWeeks,
  getPlannerWeekCount,
} from './plannerMilestones'
import { buildScheduleFromFreeMinutes } from './schedule'

export const GOALS_STORAGE_KEY = 'constai-goals-v2'

function legacyMilestonesFromMilestonePlan(mp) {
  if (!mp) return []
  if (mp.mode === 'weekly_nested' && Array.isArray(mp.weeks)) {
    return mp.weeks.map((w) => ({
      id: w.id || `leg-${w.week}`,
      weekLabel: w.week || 'Week',
      summary: w.label || '',
      beats: (w.daily || []).map((d) => ({
        id: d.id || crypto.randomUUID(),
        label: d.label || '',
      })),
    }))
  }
  if (mp.mode === 'daily' && Array.isArray(mp.items)) {
    return [
      {
        id: 'legacy-daily',
        weekLabel: 'Milestone ladder',
        summary: mp.sectionTitle || 'Checkpoints',
        beats: mp.items.map((it) => ({
          id: it.id,
          label: `${it.dayLabel || ''}: ${it.label || ''}`.trim(),
        })),
      },
    ]
  }
  return []
}

function migrateGoal(g) {
  if (!g || typeof g !== 'object' || !g.id) return null

  let tasks = (g.tasks || []).map((t) =>
    t?.id ? t : { ...t, id: crypto.randomUUID() },
  )

  const wf =
    g.weekdayFreeMinutes != null ? Math.min(24 * 60, Math.max(15, Number(g.weekdayFreeMinutes) || 60)) : 60
  const we =
    g.weekendFreeMinutes != null ? Math.min(24 * 60, Math.max(0, Number(g.weekendFreeMinutes) || 0)) : 120

  const schedule = buildScheduleFromFreeMinutes(wf, we)

  const daysUntil = g.deadline
    ? Math.max(
        1,
        Math.ceil(
          (new Date(g.deadline + 'T23:59:59') - new Date()) / 86400000,
        ),
      )
    : 28
  const estWeeks = Math.min(24, Math.max(2, Math.ceil(daysUntil / 7)))

  let cadence = g.cadence ? { ...g.cadence } : null
  if (!cadence) {
    cadence = {
      scheduleType: 'custom',
      sessionsPerWeek: 4,
      estimatedWeeks: estWeeks,
      sessionLengthMinutes: 30,
      recommendedRestDays: ['Take at least one lighter day weekly.'],
      reasoningSummary:
        'Older saved goal — cadence was upgraded. Add a new goal for a fresh AI plan.',
      assignedWeekdayNames: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    }
  }
  if (!cadence.assignedWeekdayNames?.length) {
    cadence.assignedWeekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  }

  let planMilestones = Array.isArray(g.planMilestones) ? g.planMilestones : []
  if (planMilestones.length === 0) {
    planMilestones = legacyMilestonesFromMilestonePlan(g.milestonePlan)
  }
  if (planMilestones.length === 0) {
    planMilestones = [
      {
        id: 'mig-1',
        weekLabel: 'Week 1',
        summary: 'Work through scheduled days',
        beats: [{ id: 'mig-1-b1', label: 'Open a day below to run tasks.' }],
      },
    ]
  }

  planMilestones = alignMilestonesToPlannerWeeks(
    planMilestones,
    getPlannerWeekCount(g.deadline),
  )

  tasks = assignMissingScheduledDates(tasks, g.deadline, cadence.assignedWeekdayNames)
  tasks = tasks.map((t) => ({
    ...t,
    tip: typeof t.tip === 'string' ? t.tip : '',
    allottedMinutes: t.allottedMinutes ?? t.durationMinutes ?? 25,
    durationMinutes: t.durationMinutes ?? t.allottedMinutes ?? 25,
  }))

  const { toneStyle: _t, weekdayAvailability: _wa, weekendAvailability: _wea, milestonePlan: _mp, ...rest } = g

  return {
    ...rest,
    weekdayFreeMinutes: wf,
    weekendFreeMinutes: we,
    schedule,
    cadence,
    planMilestones,
    tasks,
  }
}

export function loadGoalsFromStorage() {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.map(migrateGoal).filter(Boolean)
  } catch (e) {
    console.warn('[ConstAI] Could not load goals from localStorage:', e)
    return []
  }
}

export function saveGoalsToStorage(goals) {
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals))
  } catch (e) {
    console.warn('[ConstAI] Could not save goals to localStorage:', e)
  }
}
