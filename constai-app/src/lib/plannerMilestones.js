/**
 * Align Gemini / fallback milestones to calendar planner weeks (buildPlannerWeeks).
 */
import { buildPlannerWeeks } from './calendar'

export function getPlannerWeekCount(deadlineIso) {
  const weeks = buildPlannerWeeks(deadlineIso)
  return weeks.length > 0 ? weeks.length : 1
}

function parseWeekNumFromLabel(weekLabel) {
  const m = String(weekLabel || '').match(/week\s*(\d+)/i)
  return m ? parseInt(m[1], 10) : null
}

function sortMilestonesForAlignment(milestones) {
  return [...milestones].sort((a, b) => {
    const ia =
      typeof a.plannerWeekIndex === 'number' && !Number.isNaN(a.plannerWeekIndex)
        ? a.plannerWeekIndex
        : null
    const ib =
      typeof b.plannerWeekIndex === 'number' && !Number.isNaN(b.plannerWeekIndex)
        ? b.plannerWeekIndex
        : null
    if (ia != null && ib != null) return ia - ib
    if (ia != null) return -1
    if (ib != null) return 1
    const na = parseWeekNumFromLabel(a.weekLabel)
    const nb = parseWeekNumFromLabel(b.weekLabel)
    if (na != null && nb != null) return na - nb
    if (na != null) return -1
    if (nb != null) return 1
    return 0
  })
}

/**
 * @param {Array<{ id?: string, weekLabel?: string, summary: string, beats: Array<{id?: string, label: string}>, plannerWeekIndex?: number }>} milestones
 * @param {number} plannerWeekCount
 */
export function alignMilestonesToPlannerWeeks(milestones, plannerWeekCount) {
  const n = Math.max(1, Math.min(52, Math.round(plannerWeekCount) || 1))
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return Array.from({ length: n }, (_, i) => ({
      id: `m-${i + 1}`,
      plannerWeekIndex: i,
      weekLabel: `Week ${i + 1}`,
      summary: 'Progress toward your goal',
      beats: [
        {
          id: `m-${i + 1}-b1`,
          label: 'Complete the tasks scheduled for this week.',
        },
      ],
    }))
  }

  const sorted = sortMilestonesForAlignment(milestones)
  const out = []

  for (let i = 0; i < n; i++) {
    const src = sorted[i]
    if (!src) {
      out.push({
        id: `m-${i + 1}`,
        plannerWeekIndex: i,
        weekLabel: `Week ${i + 1}`,
        summary: 'Continue toward your deadline',
        beats: [
          {
            id: `m-${i + 1}-b1`,
            label:
              i === n - 1
                ? 'Close the loop: verify against your definition of done.'
                : 'Work the scheduled sessions; keep scope tight.',
          },
        ],
      })
      continue
    }

    let beats = Array.isArray(src.beats) ? src.beats : []
    beats = beats
      .map((b, bi) => {
        const label =
          typeof b === 'string'
            ? b.trim()
            : typeof b?.label === 'string'
              ? b.label.trim()
              : ''
        if (!label) return null
        return {
          id: b?.id && String(b.id) ? String(b.id) : `m-${i + 1}-b${bi + 1}`,
          label,
        }
      })
      .filter(Boolean)

    if (beats.length < 1) {
      beats = [
        {
          id: `m-${i + 1}-b1`,
          label: 'Complete this week’s scheduled tasks toward the goal.',
        },
      ]
    }

    const summary =
      typeof src.summary === 'string' && src.summary.trim()
        ? src.summary.trim()
        : 'Focus for this week'

    out.push({
      id: src.id && String(src.id).trim() ? String(src.id) : `m-${i + 1}`,
      plannerWeekIndex: i,
      weekLabel: `Week ${i + 1}`,
      summary,
      beats,
    })
  }

  return out
}
