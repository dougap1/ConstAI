/**
 * Builds a default weekly schedule from availability text until Gemini refines it.
 * Gemini hook: replace with API-normalized slots from the model.
 */
import {
  formatDualRange,
  parseFlexibleWindow,
} from './timeFormat'

const DEFAULT_WEEKDAY_WINDOWS = ['07:00–09:00', '17:30–20:00']
const DEFAULT_WEEKEND_WINDOWS = ['10:00–14:00']

function extractTimeLikeFragments(text) {
  if (!text || typeof text !== 'string') return []
  const parts = text
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
  const parsed = parts.filter((p) => parseFlexibleWindow(p))
  if (parsed.length) return parsed.map((p) => p.replace(/[—]/g, '–'))
  const m24 = text.match(/\d{1,2}:\d{2}\s*[–—-]\s*\d{1,2}:\d{2}/g)
  return m24?.length ? m24.map((x) => x.replace(/[—]/g, '–')) : []
}

function parseRangeToMinutes(range) {
  const p = parseFlexibleWindow(range)
  if (!p) return 0
  return Math.max(0, p.endMin - p.startMin)
}

/** Uniform display line: 12h with AM/PM · 24h */
export function formatScheduleWindowLine(windowStr) {
  const p = parseFlexibleWindow(windowStr)
  if (!p) return windowStr.trim()
  return formatDualRange(p.startMin, p.endMin)
}

function mapDisplayWindows(windows) {
  return (windows || []).map((w) => formatScheduleWindowLine(w))
}

/** Sum of weekday window lengths — proxy for “available minutes / day”. */
export function totalWeekdayMinutesFromSchedule(schedule) {
  if (schedule?.version === 'minutes_v1') {
    return Math.max(0, Number(schedule.weekdayFreeMinutes) || 0)
  }
  const windows = schedule?.weekdays?.windows
  if (!windows?.length) {
    return DEFAULT_WEEKDAY_WINDOWS.reduce(
      (s, w) => s + parseRangeToMinutes(w),
      0,
    )
  }
  return windows.reduce((s, w) => s + parseRangeToMinutes(w), 0)
}

/** Longest single window on weekdays or weekends — caps recommended session length. */
export function getMaxWindowMinutesFromSchedule(schedule) {
  if (schedule?.version === 'minutes_v1') {
    const wd = Number(schedule.weekdayFreeMinutes) || 0
    const we = Number(schedule.weekendFreeMinutes) || 0
    return Math.max(15, Math.max(wd, we))
  }
  const wd = schedule?.weekdays?.windows?.length
    ? schedule.weekdays.windows
    : DEFAULT_WEEKDAY_WINDOWS
  const we = schedule?.weekends?.windows?.length
    ? schedule.weekends.windows
    : DEFAULT_WEEKEND_WINDOWS
  let maxM = 0
  for (const w of [...wd, ...we]) {
    maxM = Math.max(maxM, parseRangeToMinutes(w))
  }
  return Math.max(maxM, 30)
}

export function computeAllottedMinutesPerTask(schedule, taskCount) {
  const total = totalWeekdayMinutesFromSchedule(schedule)
  const n = Math.max(1, taskCount)
  const raw = Math.round(total / n)
  return Math.max(15, Math.min(240, raw || 25))
}

export function getTaskAllottedMinutes(task, goal) {
  if (task?.allottedMinutes != null) return task.allottedMinutes
  if (task?.durationMinutes != null) return task.durationMinutes
  if (goal?.cadence?.sessionLengthMinutes != null)
    return goal.cadence.sessionLengthMinutes
  if (goal?.schedule)
    return computeAllottedMinutesPerTask(
      goal.schedule,
      goal.tasks?.length ?? 1,
    )
  return 25
}

/** Free-time budget per day type (minutes). Used for Gemini + caps. */
export function buildScheduleFromFreeMinutes(weekdayFreeMinutes, weekendFreeMinutes) {
  const wd = clampMinutes(weekdayFreeMinutes)
  const we = clampMinutes(weekendFreeMinutes)
  return {
    version: 'minutes_v1',
    weekdayFreeMinutes: wd,
    weekendFreeMinutes: we,
  }
}

function clampMinutes(n) {
  const x = Math.round(Number(n) || 0)
  return Math.min(24 * 60, Math.max(0, x))
}

export function buildDefaultSchedule({
  weekdayAvailability = '',
  weekendAvailability = '',
} = {}) {
  const weekdayWindows =
    extractTimeLikeFragments(weekdayAvailability) || DEFAULT_WEEKDAY_WINDOWS
  const weekendWindows =
    extractTimeLikeFragments(weekendAvailability) || DEFAULT_WEEKEND_WINDOWS

  return {
    version: 'default_v1',
    weekdays: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      windows: weekdayWindows,
      displayWindows: mapDisplayWindows(weekdayWindows),
      sourceText: weekdayAvailability,
    },
    weekends: {
      days: ['Sat', 'Sun'],
      windows: weekendWindows,
      displayWindows: mapDisplayWindows(weekendWindows),
      sourceText: weekendAvailability,
    },
  }
}
