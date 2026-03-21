/** Pad hour/minute for 24h display. */
function pad2(n) {
  return String(n).padStart(2, '0')
}

export function minutesFromMidnightTo24h(totalMin) {
  const h = Math.floor(totalMin / 60) % 24
  const m = totalMin % 60
  return `${pad2(h)}:${pad2(m)}`
}

export function minutesFromMidnightTo12h(totalMin) {
  const h24 = Math.floor(totalMin / 60) % 24
  const m = totalMin % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  const mmStr = `:${pad2(m)}`
  return `${h12}${mmStr} ${period}`
}

/** e.g. "9:00 AM – 5:00 PM · 09:00 – 17:00" */
export function formatDualRange(startMin, endMin) {
  const a = minutesFromMidnightTo12h(startMin)
  const b = minutesFromMidnightTo12h(endMin)
  const a24 = minutesFromMidnightTo24h(startMin)
  const b24 = minutesFromMidnightTo24h(endMin)
  return `${a} – ${b} · ${a24} – ${b24}`
}

/**
 * Parse one time token: 24h "9:30", "09:30", or 12h "9:30am", "9 AM"
 */
export function parseTimeToMinutes(token) {
  const t = token.trim().toLowerCase().replace(/\./g, '')
  let m = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/)
  if (m) {
    let h = Number(m[1])
    const mi = Number(m[2])
    const ap = m[3]
    if (ap === 'pm' && h < 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    return h * 60 + mi
  }
  m = t.match(/^(\d{1,2})(am|pm)$/)
  if (m) {
    let h = Number(m[1])
    if (m[2] === 'pm' && h < 12) h += 12
    if (m[2] === 'am' && h === 12) h = 0
    return h * 60
  }
  m = t.match(/^(\d{1,2})\s*(am|pm)$/)
  if (m) {
    let h = Number(m[1])
    if (m[2] === 'pm' && h < 12) h += 12
    if (m[2] === 'am' && h === 12) h = 0
    return h * 60
  }
  m = t.match(/^(\d{1,2}):(\d{2})$/)
  if (m) {
    return Number(m[1]) * 60 + Number(m[2])
  }
  return null
}

/**
 * Parse "07:00–09:00", "7am-9am", "7:00 AM – 9:00 PM", etc.
 * Returns { startMin, endMin } or null.
 */
export function parseFlexibleWindow(str) {
  if (!str || typeof str !== 'string') return null
  const s = str.replace(/[—–]/g, '-').trim()
  const parts = s.split(/\s*-\s*/)
  if (parts.length !== 2) return null
  const start = parseTimeToMinutes(parts[0])
  const end = parseTimeToMinutes(parts[1])
  if (start == null || end == null) return null
  let endM = end
  if (endM < start) endM += 24 * 60
  return { startMin: start, endMin: endM }
}

export function formatWindowLine(str) {
  const parsed = parseFlexibleWindow(str)
  if (!parsed) return str
  return formatDualRange(parsed.startMin, parsed.endMin)
}
