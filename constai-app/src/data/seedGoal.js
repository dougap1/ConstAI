/**
 * Dummy seed data for new goals. Replace with API response or AI-generated
 * milestones/tasks when backend / agent integration exists.
 */
export function dummyMilestones() {
  return [
    { id: 'm1', label: 'Define the north star', week: 'Week 1' },
    { id: 'm2', label: 'Ship first working slice', week: 'Week 2' },
    { id: 'm3', label: 'Gather signal & iterate', week: 'Week 3' },
    { id: 'm4', label: 'Polish & reflect', week: 'Week 4' },
  ]
}

export function dummyTasks(allottedMinutesEach = 25) {
  return [
    {
      id: 'd1',
      title: '10 min clarity write-up',
      done: false,
      allottedMinutes: allottedMinutesEach,
    },
    {
      id: 'd2',
      title: 'Block deep work (no meetings)',
      done: false,
      allottedMinutes: allottedMinutesEach,
    },
    {
      id: 'd3',
      title: 'Review weekly milestones',
      done: false,
      allottedMinutes: allottedMinutesEach,
    },
    {
      id: 'd4',
      title: 'One small win for future-you',
      done: false,
      allottedMinutes: allottedMinutesEach,
    },
  ]
}

export function dummyMotivationalNote() {
  return "Small repeats become big arcs. Today doesn't need to be perfect — it needs to be honest."
}

/** Rotate quotes from CMS or AI later. */
export const DAILY_QUOTES = [
  {
    text: 'Focus is saying no to a thousand good ideas.',
    attribution: '— inspired by craft, not a lecture',
  },
  {
    text: 'The future belongs to those who ship calm, steady progress.',
    attribution: '— ConstAI mantra',
  },
  {
    text: 'Your attention is the rarest currency you have.',
    attribution: '— keep spending it on purpose',
  },
]
