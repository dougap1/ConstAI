/**
 * TonePicker — coaching voice / UI accent (strict · calm · neutral).
 * AI hook: map tone to system prompt temperature or coach personality.
 */
const OPTIONS = [
  {
    id: 'strict',
    label: 'Strict',
    hint: 'Crisp edges, high signal',
  },
  {
    id: 'calm',
    label: 'Calm',
    hint: 'Soft pacing, breathing room',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    hint: 'Balanced default',
  },
]

export default function TonePicker({
  value,
  onChange,
  name = 'tone',
  legend = 'Tone',
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <label
            key={o.id}
            className={`cursor-pointer rounded-2xl border px-3 py-2 text-left transition ${
              value === o.id
                ? 'border-sky-500/70 bg-sky-500/10 dark:border-sky-400/60 dark:bg-sky-500/15'
                : 'border-slate-200/90 bg-white/50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={value === o.id}
              onChange={() => onChange(o.id)}
              className="sr-only"
            />
            <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
              {o.label}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {o.hint}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
