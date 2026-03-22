import { useEffect, useState } from 'react'

const initialDetails = {
  whyItMatters: '',
  focusArea: '',
  deadline: '',
  weekdayFreeMinutes: '60',
  weekendFreeMinutes: '120',
}

export default function CreateGoalWizard({
  onComplete,
  onCancel,
  submitting = false,
  onStepChange,
}) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState(initialDetails)

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  function handleContinue(e) {
    e.preventDefault()
    if (!title.trim()) return
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    const d = details
    const wd = Number(d.weekdayFreeMinutes)
    const we = Number(d.weekendFreeMinutes)
    if (
      !d.whyItMatters.trim() ||
      !d.focusArea.trim() ||
      !d.deadline ||
      Number.isNaN(wd) ||
      wd < 15 ||
      Number.isNaN(we) ||
      we < 0
    ) {
      return
    }
    const payload = {
      title: title.trim(),
      whyItMatters: d.whyItMatters,
      focusArea: d.focusArea,
      deadline: d.deadline,
      weekdayFreeMinutes: wd,
      weekendFreeMinutes: we,
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
      {step === 2 ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-sky-600 hover:underline dark:text-slate-400 dark:hover:text-sky-400"
          >
            Edit name
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label
              htmlFor="goal-title"
              className="block text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Goal Name
            </label>
            <input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Run a 5K"
              className={fieldClass}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-sky-600 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500 active:scale-[0.98] dark:bg-sky-600 dark:hover:bg-sky-500 sm:flex-none"
            >
              Proceed
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
          <p className="rounded-2xl border border-sky-200/60 bg-sky-50/50 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-white">
            {title.trim()}
          </p>

          <div>
            <label htmlFor="why" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Why it matters
            </label>
            <textarea
              id="why"
              required
              rows={2}
              value={details.whyItMatters}
              onChange={(e) =>
                setDetails((s) => ({ ...s, whyItMatters: e.target.value }))
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="focus" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Focus area
            </label>
            <input
              id="focus"
              required
              value={details.focusArea}
              onChange={(e) =>
                setDetails((s) => ({ ...s, focusArea: e.target.value }))
              }
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
              htmlFor="wd-min"
              className="text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Weekday — free minutes / day
            </label>
            <input
              id="wd-min"
              type="number"
              min={15}
              max={1440}
              required
              value={details.weekdayFreeMinutes}
              onChange={(e) =>
                setDetails((s) => ({
                  ...s,
                  weekdayFreeMinutes: e.target.value,
                }))
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="we-min"
              className="text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Weekend — free minutes / day
            </label>
            <input
              id="we-min"
              type="number"
              min={0}
              max={1440}
              required
              value={details.weekendFreeMinutes}
              onChange={(e) =>
                setDetails((s) => ({
                  ...s,
                  weekendFreeMinutes: e.target.value,
                }))
              }
              className={fieldClass}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-sky-600 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500 disabled:cursor-wait disabled:opacity-70 sm:flex-none"
            >
              {submitting ? '…' : 'Add goal'}
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
