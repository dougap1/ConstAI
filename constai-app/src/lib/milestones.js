/**
 * Deadline-driven milestone structure. Strict tone → rigorous copy toward deadline.
 * Gemini hook: replace with model-generated milestone graph.
 */

function daysUntilDeadline(deadlineIso) {
  if (!deadlineIso) return 30
  const end = new Date(deadlineIso + 'T23:59:59')
  if (Number.isNaN(end.getTime())) return 30
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const ms = end - start
  return Math.max(1, Math.ceil(ms / 86400000))
}

/**
 * >14 days out → daily milestone ladder.
 * Otherwise → weekly buckets each with nested daily beats.
 */
export function buildMilestonePlan(deadlineIso, toneStyle = 'neutral') {
  const days = daysUntilDeadline(deadlineIso)
  const strict = toneStyle === 'strict'

  if (days > 14) {
    const n = Math.min(7, Math.max(4, Math.ceil(days / 4)))
    const items = Array.from({ length: n }, (_, i) => ({
      id: `d-${i + 1}`,
      dayLabel: `Day ${i + 1}`,
      label:
        i === 0
          ? 'Orient: define the smallest shippable slice for this goal.'
          : i === n - 1
            ? 'Close the loop: review, tighten, prep the final push to deadline.'
            : `Ship visible progress — block deep work and protect the slot.`,
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

  const weeks = [
    {
      id: 'w1',
      week: 'Week 1',
      label: 'Frame the outcome and carve protected build time.',
      daily: [
        { id: 'w1-1', label: 'Write a one-paragraph definition of “done.”' },
        { id: 'w1-2', label: 'Calendar two immovable focus blocks.' },
        { id: 'w1-3', label: 'Ship one tangible artifact (draft, wire, outline).' },
      ],
    },
    {
      id: 'w2',
      week: 'Week 2',
      label: 'Increase throughput; cut scope that does not serve the deadline.',
      daily: [
        { id: 'w2-1', label: 'Morning: pick the single riskiest unknown.' },
        { id: 'w2-2', label: 'Afternoon: resolve it or timebox a spike.' },
        { id: 'w2-3', label: 'Evening: 10-line retro — what to repeat tomorrow.' },
      ],
    },
    {
      id: 'w3',
      week: 'Week 3',
      label: 'Tighten quality and remove friction for the final stretch.',
      daily: [
        { id: 'w3-1', label: 'Polish the critical path only.' },
        { id: 'w3-2', label: 'Run an end-to-end dry run.' },
        { id: 'w3-3', label: 'Prep the “ship checklist.”' },
      ],
    },
    {
      id: 'w4',
      week: 'Week 4',
      label: 'Land clean: verify, celebrate, capture learnings.',
      daily: [
        { id: 'w4-1', label: 'Final verification against your definition of done.' },
        { id: 'w4-2', label: 'Buffer day for surprises.' },
        { id: 'w4-3', label: 'Reflect: what would you compress next time?' },
      ],
    },
  ]

  return {
    mode: 'weekly_nested',
    sectionTitle: 'Weekly milestones',
    subtitle: strict
      ? 'Strict scheduling: each week nests daily moves so you meet or beat the deadline.'
      : 'Each week holds smaller daily milestones — pace without panic.',
    weeks,
  }
}
