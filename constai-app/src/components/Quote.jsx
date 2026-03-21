/**
 * Quote — daily inspiration strip.
 * AI hook: replace `text` / `attribution` with LLM-personalized copy using user context.
 */
export default function Quote({ text, attribution, className = '' }) {
  return (
    <figure
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/50 ${className}`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-linear-to-br from-sky-400/25 to-cyan-400/20 blur-2xl"
        aria-hidden
      />
      <blockquote className="relative text-pretty text-base leading-relaxed text-slate-800 dark:text-slate-100">
        “{text}”
      </blockquote>
      {attribution ? (
        <figcaption className="relative mt-3 text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400">
          {attribution}
        </figcaption>
      ) : null}
    </figure>
  )
}
