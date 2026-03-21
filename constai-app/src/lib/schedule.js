/**
 * Builds a default weekly schedule from availability text until Gemini refines it.
 * Gemini hook: replace this with API-normalized slots from the model.
 */
const DEFAULT_WEEKDAY_WINDOWS = ['07:00–09:00', '17:30–20:00']
const DEFAULT_WEEKEND_WINDOWS = ['10:00–14:00']

function extractTimeLikeFragments(text) {
  if (!text || typeof text !== 'string') return []
  const matches = text.match(/\d{1,2}:\d{2}\s*[–—-]\s*\d{1,2}:\d{2}/g)
  return matches?.length ? matches.map((m) => m.replace(/—/g, '–')) : []
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
      sourceText: weekdayAvailability,
    },
    weekends: {
      days: ['Sat', 'Sun'],
      windows: weekendWindows,
      sourceText: weekendAvailability,
    },
  }
}
