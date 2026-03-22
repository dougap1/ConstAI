/** Planner weeks from today through deadline (inclusive), local calendar. */

const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function toDateKey(d) {
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return null
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayDateKey() {
  return toDateKey(new Date())
}

export function weekdayShortFromKey(dateKey) {
  const parts = String(dateKey).split('-').map(Number)
  if (parts.length !== 3) return ''
  const dt = new Date(parts[0], parts[1] - 1, parts[2])
  if (Number.isNaN(dt.getTime())) return ''
  return SHORT[dt.getDay()]
}

/**
 * @param {string} deadlineIso - YYYY-MM-DD (local interpretation)
 */
export function buildPlannerWeeks(deadlineIso) {
  if (!deadlineIso) return []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const [ey, em, ed] = deadlineIso.split('-').map(Number)
  const end = new Date(ey, em - 1, ed)
  end.setHours(0, 0, 0, 0)
  if (Number.isNaN(end.getTime())) return []
  if (end < start) return []

  const dayKeys = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = toDateKey(d)
    dayKeys.push({
      dateKey,
      label: d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      weekdayShort: SHORT[d.getDay()],
    })
  }

  if (dayKeys.length === 0) return []

  const weeks = []
  for (let i = 0; i < dayKeys.length; i += 7) {
    const chunk = dayKeys.slice(i, i + 7)
    weeks.push({
      id: `week-${weeks.length + 1}`,
      label: `Week ${weeks.length + 1}`,
      days: chunk,
      dayCount: chunk.length,
    })
  }

  return weeks
}

export function enumerateDateKeysToDeadline(deadlineIso) {
  return buildPlannerWeeks(deadlineIso).flatMap((w) =>
    w.days.map((d) => d.dateKey),
  )
}
