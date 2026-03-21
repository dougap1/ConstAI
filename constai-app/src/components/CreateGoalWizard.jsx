import { useState } from 'react'
import TonePicker from './TonePicker'

const initialDetails = {
  whyItMatters: '',
  focusArea: '',
  deadline: '',
  weekdayAvailability: '',
  weekendAvailability: '',
  toneStyle: 'neutral',
}

/**
 * Step 1: name · Step 2: intake fields. Submits assembled goal via parent.
 * Gemini hook: parent persists `intakeForGemini` from createGoalFromIntake.
 */
export default function CreateGoalWizard({
  onComplete,
  onCancel,
  submitting = false,
}) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState(initialDetails)

  function handleContinue(e) {
    e.preventDefault()
    if (!title.trim()) return
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    const d = details
    if (
      !d.whyItMatters.trim() ||
      !d.focusArea.trim() ||
      !d.deadline ||
      !d.weekdayAvailability.trim() ||
      !d.weekendAvailability.trim()
    ) {
      return
    }
    const payload = {
      title: title.trim(),
      whyItMatters: d.whyItMatters,
      focusArea: d.focusArea,
      deadline: d.deadline,
      weekdayAvailability: d.weekdayAvailability,
      weekendAvailability: d.weekendAvailability,
      toneStyle: d.toneStyle,
    }
    try {
      await onComplete?.(payload)
    } catch (err) {
      console.error(err)
      return
    }
    setTitle('')
    setDetails(initialDetails)
    setStep(1)
  }

  const fieldClass =
    'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500'

  return (
    <div className="constai-animate-in rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/50">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
          New goal · step {step} of 2
        </p>
        {step === 2 ? (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-sky-600 hover:underline dark:text-slate-400 dark:hover:text-sky-400"
          >
            Edit name
          </button>
        ) : null}
      </div>

      {step === 1 ? (
        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label
              htmlFor="goal-title"
              className="text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Goal name
            </label>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Next, you’ll add context — Gemini turns it into tasks and milestones
              when your API key is configured.
            </p>
            <input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ship ConstAI MVP"
              className={fieldClass}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-sky-600 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500 active:scale-[0.98] sm:flex-none"
            >
              Continue
            </button>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="rounded-2xl border border-sky-200/60 bg-sky-50/50 px-4 py-3 text-sm text-slate-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">
              {title.trim()}
            </span>
          </p>

          <div>
            <label htmlFor="why" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Why this goal matters
            </label>
            <textarea
              id="why"
              required
              rows={3}
              value={details.whyItMatters}
              onChange={(e) =>
                setDetails((s) => ({ ...s, whyItMatters: e.target.value }))
              }
              placeholder="What changes when you finish this?"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="focus" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Specific focus area
            </label>
            <input
              id="focus"
              required
              value={details.focusArea}
              onChange={(e) =>
                setDetails((s) => ({ ...s, focusArea: e.target.value }))
              }
              placeholder="e.g. onboarding flow + first paying user"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="deadline" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              required
              value={details.deadline}
              onChange={(e) =>
                setDetails((s) => ({ ...s, deadline: e.target.value }))
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="weekday-avail"
              className="text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Weekday availability
            </label>
            <input
              id="weekday-avail"
              required
              value={details.weekdayAvailability}
              onChange={(e) =>
                setDetails((s) => ({
                  ...s,
                  weekdayAvailability: e.target.value,
                }))
              }
              placeholder="e.g. 7:00 AM–9:00 AM, 5:30 PM–8:00 PM or 17:30–20:00"
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="weekend-avail"
              className="text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Weekend availability
            </label>
            <input
              id="weekend-avail"
              required
              value={details.weekendAvailability}
              onChange={(e) =>
                setDetails((s) => ({
                  ...s,
                  weekendAvailability: e.target.value,
                }))
              }
              placeholder="e.g. 10:00 AM–2:00 PM or 10:00–14:00"
              className={fieldClass}
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/40 p-4 dark:border-slate-700/80 dark:bg-slate-950/30">
            <TonePicker
              name="goal-tone-style"
              legend="Tone style"
              value={details.toneStyle}
              onChange={(id) =>
                setDetails((s) => ({ ...s, toneStyle: id }))
              }
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            A default schedule is parsed from your availability text (12h with AM/PM
            or 24h). The dashboard shows both formats. After you submit, Gemini
            returns structured JSON for tasks and milestones (daily if your
            deadline is soon, weekly if it is farther out).
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-sky-600 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500 active:scale-[0.98] enabled:active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 sm:flex-none"
            >
              {submitting ? 'Generating plan…' : 'Add goal'}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep(1)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800/80"
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
