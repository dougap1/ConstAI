import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { getDaysUntilDeadline } from './milestones'

/** Prefer a model your AI Studio key can access; override with VITE_GEMINI_MODEL. */
const DEFAULT_MODEL = 'gemini-1.5-flash'

function goalPlanResponseSchema() {
  const dailyItemSchema = {
    type: SchemaType.OBJECT,
    properties: {
      dayLabel: { type: SchemaType.STRING },
      label: { type: SchemaType.STRING },
    },
    required: ['dayLabel', 'label'],
  }

  const weekDailySchema = {
    type: SchemaType.OBJECT,
    properties: {
      label: { type: SchemaType.STRING },
    },
    required: ['label'],
  }

  const weekSchema = {
    type: SchemaType.OBJECT,
    properties: {
      week: { type: SchemaType.STRING },
      label: { type: SchemaType.STRING },
      daily: { type: SchemaType.ARRAY, items: weekDailySchema },
    },
    required: ['week', 'label', 'daily'],
  }

  const milestonePlanSchema = {
    type: SchemaType.OBJECT,
    properties: {
      mode: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: ['daily', 'weekly_nested'],
      },
      sectionTitle: { type: SchemaType.STRING },
      subtitle: { type: SchemaType.STRING },
      items: { type: SchemaType.ARRAY, items: dailyItemSchema },
      weeks: { type: SchemaType.ARRAY, items: weekSchema },
    },
    required: ['mode', 'sectionTitle', 'subtitle', 'items', 'weeks'],
  }

  return {
    type: SchemaType.OBJECT,
    properties: {
      motivationalNote: { type: SchemaType.STRING },
      tasks: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
          },
          required: ['title'],
        },
      },
      milestonePlan: milestonePlanSchema,
    },
    required: ['motivationalNote', 'tasks', 'milestonePlan'],
  }
}

function buildSystemInstruction() {
  return `You are ConstAI's planning engine. The user completed a goal intake form. Their answers are provided as JSON.

Rules:
- Produce actionable, specific tasks (not generic platitudes). Tie tasks to their title, focus area, and deadline.
- motivationalNote: 1–3 sentences, warm and practical, reflecting their "why it matters" and tone style.
- tasks: between 4 and 8 items. Short imperative titles (under ~80 characters).
- milestonePlan.mode MUST be:
  - "daily" when daysUntilDeadline <= 14 (short horizon — day-by-day milestones).
  - "weekly_nested" when daysUntilDeadline > 14 (longer horizon — week themes plus nested daily beats).
- For "daily" mode: fill milestonePlan.items with one entry per milestone (3–14 items). Use dayLabel like "Day 1", "Day 2", … and label as a concrete outcome for that day. Set milestonePlan.weeks to [].
- For "weekly_nested" mode: fill milestonePlan.weeks with one object per week. The number of weeks should match roughly ceil(daysUntilDeadline / 7), capped at 12 and at least 2. Each week needs week (e.g. "Week 1"), label (week theme), and daily (2–5 nested daily milestones). Set milestonePlan.items to [].
- sectionTitle and subtitle should match the chosen mode and their tone style (strict = more deadline-focused; calm = gentler; neutral = balanced).
- Output must follow the response schema exactly — no markdown, no code fences, no extra keys.`
}

/**
 * Calls Gemini with structured JSON output. API key is read from the browser bundle (VITE_*); use a backend proxy for production.
 */
export async function generateGoalPlanFromGemini(intakeForGemini, apiKey, options = {}) {
  const { signal, model = import.meta.env.VITE_GEMINI_MODEL?.trim() || DEFAULT_MODEL } =
    options

  const daysUntil = getDaysUntilDeadline(intakeForGemini.deadline)

  const genAI = new GoogleGenerativeAI(apiKey)
  const genModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: goalPlanResponseSchema(),
    },
    systemInstruction: buildSystemInstruction(),
  })

  const userPayload = {
    ...intakeForGemini,
    daysUntilDeadline: daysUntil,
    milestoneModeHint: daysUntil > 14 ? 'weekly_nested' : 'daily',
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
