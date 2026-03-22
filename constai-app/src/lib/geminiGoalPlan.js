import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { buildPlannerWeeks, todayDateKey } from './calendar'
import { getDaysUntilDeadline } from './milestones'

const DEFAULT_MODEL = 'gemini-2.5-flash'

function goalPlanResponseSchema() {
  const beatSchema = {
    type: SchemaType.OBJECT,
    properties: {
      label: { type: SchemaType.STRING },
    },
    required: ['label'],
  }

  const milestoneSchema = {
    type: SchemaType.OBJECT,
    properties: {
      plannerWeekIndex: {
        type: SchemaType.INTEGER,
        description:
          '0-based index of the planner week (Week 1 = 0). Optional if order matches weeks.',
      },
      weekLabel: { type: SchemaType.STRING },
      summary: { type: SchemaType.STRING },
      beats: { type: SchemaType.ARRAY, items: beatSchema },
    },
    required: ['weekLabel', 'summary', 'beats'],
  }

  const taskSchema = {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      week: { type: SchemaType.STRING },
      sessionLabel: { type: SchemaType.STRING },
      durationMinutes: { type: SchemaType.INTEGER },
      scheduledDate: { type: SchemaType.STRING },
      tip: { type: SchemaType.STRING },
      dayLabel: { type: SchemaType.STRING },
      completed: { type: SchemaType.BOOLEAN },
    },
    required: ['title', 'week', 'sessionLabel', 'durationMinutes', 'scheduledDate'],
  }

  return {
    type: SchemaType.OBJECT,
    properties: {
      scheduleType: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: [
          'daily',
          'weekdays_only',
          'weekends_only',
          'several_days_per_week',
          'milestone_based',
          'flex_blocks',
          'mixed',
          'custom',
        ],
      },
      sessionsPerWeek: { type: SchemaType.INTEGER },
      estimatedWeeks: { type: SchemaType.INTEGER },
      sessionLengthMinutes: { type: SchemaType.INTEGER },
      assignedWeekdayNames: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      recommendedRestDays: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      reasoningSummary: { type: SchemaType.STRING },
      motivationalNote: { type: SchemaType.STRING },
      milestones: { type: SchemaType.ARRAY, items: milestoneSchema },
      tasks: { type: SchemaType.ARRAY, items: taskSchema },
    },
    required: [
      'scheduleType',
      'sessionsPerWeek',
      'estimatedWeeks',
      'sessionLengthMinutes',
      'assignedWeekdayNames',
      'recommendedRestDays',
      'reasoningSummary',
      'motivationalNote',
      'milestones',
      'tasks',
    ],
  }
}

function buildSystemInstruction() {
  return `You are ConstAI's planning engine.

Input JSON includes: title, motivation (whyItMatters), focus, deadline, weekdayFreeMinutes, weekendFreeMinutes (per-day budget), daysUntilDeadline, plannerWeekCount (number of calendar weeks from today through the deadline in the app), todayDate, and schedule summary.

Everything you output must move the user toward finishing their specific goal by the deadline. Tasks and milestones must be concrete, goal-specific, and sequenced so completing them implies real progress (not generic filler).

Rules:
1) Infer goal type (gym/fitness, LeetCode/study, portfolio project, habit, exam prep, etc.) and pick a REALISTIC weekly pattern.
2) assignedWeekdayNames: array of 3-letter English weekdays (Mon,Tue,Wed,Thu,Fri,Sat,Sun) the user should work on THIS goal. Examples: gym might use 3–4 consecutive days + rest (e.g. Mon,Tue,Wed,Fri); LeetCode might use Mon–Fri only; heavy weekend workers might use Sat,Sun with more minutes those days.
3) sessionsPerWeek: 1–7. Do NOT assume 5 or 7 unless the goal truly needs it.
4) sessionLengthMinutes must be ≤ min(weekdayFreeMinutes, weekendFreeMinutes) when both apply, or ≤ the relevant day's budget. You may bias longer sessions on weekends if weekdayFreeMinutes is small — say so in reasoningSummary.
5) Each task MUST include scheduledDate as YYYY-MM-DD within the range from todayDate through the deadline (inclusive). Spread tasks across assignedWeekdayNames. durationMinutes per task should share the available time sensibly across those work days. Task titles must be actionable steps toward the stated goal; tips must help execute that step.
6) Each task includes tip: one short practical sentence on how to execute (technique, warmup, focus trick).
7) milestones: You MUST output exactly plannerWeekCount milestones (same count as weeks in the schedule). Index i (0-based) corresponds to Week i+1 of the planner: milestone 0 = first week from today, etc. Each milestone has a clear weekly summary and 2–5 beats that describe outcomes for that week. Beats should ladder toward the final goal. You may set plannerWeekIndex to the 0-based week index when helpful; otherwise keep milestones in week order. Tasks dated in a given planner week should support that week's milestone (same week index).
8) reasoningSummary: why this weekday pattern and time split fit the goal and their minutes budget.
9) Output only JSON matching the schema.`
}

export async function generateGoalPlanFromGemini(intakeForGemini, apiKey, options = {}) {
  const { signal, model = import.meta.env.VITE_GEMINI_MODEL?.trim() || DEFAULT_MODEL } =
    options

  const daysUntil = getDaysUntilDeadline(intakeForGemini.deadline)
  const plannerWeeks = buildPlannerWeeks(intakeForGemini.deadline)
  const plannerWeekCount = plannerWeeks.length > 0 ? plannerWeeks.length : 1

  const genAI = new GoogleGenerativeAI(apiKey)
  const genModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: goalPlanResponseSchema(),
    },
    systemInstruction: buildSystemInstruction(),
  })

  const userPayload = {
    ...intakeForGemini,
    daysUntilDeadline: daysUntil,
    todayDate: todayDateKey(),
    plannerWeekCount,
    plannerWeekLabels: plannerWeeks.map((w, i) => ({
      weekNumber: i + 1,
      label: w.label,
      dayCount: w.dayCount,
      startDate: w.days[0]?.dateKey,
      endDate: w.days[w.days.length - 1]?.dateKey,
    })),
  }

  let result
  try {
    result = await genModel.generateContent(
      {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Goal intake (JSON):\n${JSON.stringify(userPayload, null, 2)}`,
              },
            ],
          },
        ],
      },
      signal ? { signal } : undefined,
    )
  } catch (e) {
    const msg = e?.message || String(e)
    throw new Error(
      `Gemini request failed (${model}): ${msg}. Check the key, model name, and network.`,
    )
  }

  let text
  try {
    text = result.response.text()
  } catch (e) {
    const msg = e?.message || String(e)
    throw new Error(`Gemini blocked or empty response: ${msg}`)
  }

  if (!text?.trim()) throw new Error('Empty Gemini response body')
  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error(
      `Gemini returned non-JSON: ${e?.message || e}. Snippet: ${text.slice(0, 120)}…`,
    )
  }
}

export function readGeminiApiKeyFromEnv() {
  const k = import.meta.env.VITE_GEMINI_API_KEY
  if (typeof k !== 'string') return ''
  return k
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^["']|["']$/g, '')
}
