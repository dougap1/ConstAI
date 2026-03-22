import { enumerateDateKeysToDeadline, weekdayShortFromKey } from './calendar'

const ALIASES = {
  sunday: 'Sun',
  sun: 'Sun',
  monday: 'Mon',
  mon: 'Mon',
  tuesday: 'Tue',
  tue: 'Tue',
  tues: 'Tue',
  wednesday: 'Wed',
  wed: 'Wed',
  thursday: 'Thu',
  thu: 'Thu',
  thur: 'Thu',
  thurs: 'Thu',
  friday: 'Fri',
  fri: 'Fri',
  saturday: 'Sat',
  sat: 'Sat',
}

export function normalizeWeekdayToken(s) {
  if (typeof s !== 'string') return null
  const k = s.trim().toLowerCase()
  if (k.length <= 3 && ALIASES[k]) return ALIASES[k]
  const long = ALIASES[k]
  if (long) return long
  const cap = s.trim().slice(0, 3)
  const up = cap.charAt(0).toUpperCase() + cap.slice(1).toLowerCase()
  if (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].includes(up)) return up
  return null
}

/**
 * @param {string[]} names - e.g. ["Mon","Tue","Wed"]
 * @returns {Set<string>} Sun..Sat
 */
export function normalizeAssignedWeekdays(names) {
  const set = new Set()
  if (!Array.isArray(names)) return set
  for (const n of names) {
    const x = normalizeWeekdayToken(String(n))
    if (x) set.add(x)
  }
  return set
}

/**
 * Filters calendar date keys to those whose weekday is in allowed set.
 * Weekend bias: if weekendKeys provided and preferWeekend, interleave.
 */
export function filterDatesByWeekdays(allKeys, allowedSet) {
  if (!allowedSet || allowedSet.size === 0) return [...allKeys]
  return allKeys.filter((k) => allowedSet.has(weekdayShortFromKey(k)))
}

/**
 * Assign scheduledDate to tasks missing or invalid date.
 */
export function assignMissingScheduledDates(tasks, deadlineIso, assignedWeekdayNames) {
  const allKeys = enumerateDateKeysToDeadline(deadlineIso)
  if (allKeys.length === 0) return tasks

  const allowed = normalizeAssignedWeekdays(assignedWeekdayNames)
  let workKeys = filterDatesByWeekdays(allKeys, allowed)
  if (workKeys.length === 0) workKeys = [...allKeys]

  const valid = new Set(allKeys)
  let i = 0
  return tasks.map((t) => {
    const d = t.scheduledDate
    if (typeof d === 'string' && valid.has(d.slice(0, 10))) {
      return { ...t, scheduledDate: d.slice(0, 10) }
    }
    const date = workKeys[i % workKeys.length]
    i += 1
    return { ...t, scheduledDate: date }
  })
}
