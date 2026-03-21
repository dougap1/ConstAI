import { useEffect, useRef, useState } from 'react'

/**
 * Apple-style vertical scroll driving a subtle horizontal slide of cards.
 * AI hook: each card could show AI “focus themes” or generated briefs per goal.
 */
export default function ScrollLinkedStrip({ items = [] }) {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const [shift, setShift] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const maxShift = () =>
      Math.max(0, track.scrollWidth - section.clientWidth * 0.85)

    const onScroll = () => {
      const rect = section.getBoundingClientRect()
      const total = section.offsetHeight - window.innerHeight
      const scrolled = -rect.top
      const p = total <= 0 ? 0 : Math.min(1, Math.max(0, scrolled / total))
      setShift(p * maxShift())
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [items.length])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[140vh] py-16"
      aria-label="Focus carousel driven by scroll"
    >
      <div className="sticky top-0 flex min-h-[70vh] flex-col justify-center gap-6 overflow-hidden px-4 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
            Flow
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Scroll down — your focus lanes drift sideways, like turning a
            gentle dial.
          </h2>
        </div>
        <div className="relative -mx-4 sm:-mx-8">
          <div
            ref={trackRef}
            className="flex w-max gap-4 pb-2 pl-4 pr-24 will-change-transform sm:gap-6 sm:pl-8"
            style={{ transform: `translate3d(-${shift}px, 0, 0)` }}
          >
            {items.map((item, i) => (
              <article
                key={item.id ?? i}
                className="w-[min(100vw-3rem,320px)] shrink-0 rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/50 sm:w-80"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                  {item.kicker}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
