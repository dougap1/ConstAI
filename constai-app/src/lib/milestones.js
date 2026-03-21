/**
 * Deadline-driven milestone structure. Short horizons → daily; longer → weekly + nested dailies.
 * Used as fallback when Gemini is unavailable; AI uses the same shapes.
 */

export function getDaysUntilDeadline(deadlineIso) {
  if (!deadlineIso) return 30
  const end = new Date(deadlineIso + 'T23:59:59')
  if (Number.isNaN(end.getTime())) return 30
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const ms = end - start
  return Math.max(1, Math.ceil(ms / 86400000))
}

const WEEKLY_FALLBACK_WEEKS = [
  {
    label: 'Frame the outcome and carve protected build time.',
    daily: [
      'Write a one-paragraph definition of “done.”',
      'Calendar two immovable focus blocks.',
      'Ship one tangible artifact (draft, wire, outline).',
    ],
  },
  {
    label: 'Increase throughput; cut scope that does not serve the deadline.',
    daily: [
      'Morning: pick the single riskiest unknown.',
      'Afternoon: resolve it or timebox a spike.',
      'Evening: 10-line retro — what to repeat tomorrow.',
    ],
  },
  {
    label: 'Tighten quality and remove friction for the final stretch.',
    daily: [
      'Polish the critical path only.',
      'Run an end-to-end dry run.',
      'Prep the “ship checklist.”',
    ],
  },
  {
    label: 'Land clean: verify, celebrate, capture learnings.',
    daily: [
      'Final verification against your definition of done.',
      'Buffer day for surprises.',
      'Reflect: what would you compress next time?',
    ],
  },
]

/**
 * ≤14 days out → daily milestone ladder.
 * >14 days → weekly buckets each with nested daily beats.
 */
export function buildMilestonePlan(deadlineIso, toneStyle = 'neutral') {
  const days = getDaysUntilDeadline(deadlineIso)
  const strict = toneStyle === 'strict'

  if (days <= 14) {
    const n = Math.min(14, Math.max(3, days))
    const items = Array.from({ length: n }, (_, i) => ({
      id: `d-${i + 1}`,
      dayLabel: `Day ${i + 1}`,
      label:
        i === 0
          ? 'Orient: define the smallest shippable slice for this goal.'
          : i === n - 1
            ? 'Close the loop: review, tighten, prep the final push to deadline.'
            : 'Ship visible progress — block deep work and protect the slot.',
    }))
    return {
      mode: 'daily',
      sectionTitle: 'Daily milestones',
      subtitle: strict
        ? 'Strict mode: hit each daily milestone so you finish at or before the deadline.'
        : 'Steady daily beats build the arc toward your deadline.',
      items,
    }
  }

  const weekCount = Math.min(12, Math.max(2, Math.ceil(days / 7)))
  const weeks = Array.from({ length: weekCount }, (_, wi) => {
    const tmpl = WEEKLY_FALLBACK_WEEKS[wi % WEEKLY_FALLBACK_WEEKS.length]
    return {
      id: `w${wi + 1}`,
      week: `Week ${wi + 1}`,
      label: tmpl.label,
      daily: tmpl.daily.map((label, di) => ({
        id: `w${wi + 1}-${di + 1}`,
        label,
      })),
    }
  })

  return {
    mode: 'weekly_nested',
    sectionTitle: 'Weekly milestones',
    subtitle: strict
      ? 'Strict scheduling: each week nests daily moves so you meet or beat the deadline.'
      : 'Each week holds smaller daily milestones — pace without panic.',
    weeks,
  }
}
