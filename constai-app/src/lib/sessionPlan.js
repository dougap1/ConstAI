/**
 * Builds ordered focus segments: work, optional 10m break (work > 60m), work.
 * Break start is randomized in the middle 50% of total work minutes.
 */
const BREAK_SEC = 10 * 60

function randomIntInclusive(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function buildFocusSessionPlan(workMinutesTotal) {
  const w = Math.max(1, Math.round(workMinutesTotal))
  const workSec = w * 60

  if (w <= 60) {
    return {
      segments: [{ type: 'work', durationSec: workSec, label: 'Focus' }],
      totalSessionSec: workSec,
      workMinutesTotal: w,
    }
  }

  const low = Math.max(1, Math.ceil(w * 0.25))
  const high = Math.max(low, Math.floor(w * 0.75))
  let part1Min = randomIntInclusive(low, high)
  let part2Min = w - part1Min
  if (part2Min < 1) {
    part1Min = Math.floor(w / 2)
    part2Min = w - part1Min
  }

  return {
    segments: [
      { type: 'work', durationSec: part1Min * 60, label: 'Focus' },
      { type: 'break', durationSec: BREAK_SEC, label: 'Break' },
      { type: 'work', durationSec: part2Min * 60, label: 'Focus' },
    ],
    totalSessionSec: part1Min * 60 + BREAK_SEC + part2Min * 60,
    workMinutesTotal: w,
  }
}

/** Where elapsed time falls within the plan (for UI + labels). */
export function getActiveSlice(segments, elapsedSec) {
  let acc = 0
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const end = acc + seg.durationSec
    if (elapsedSec < end) {
      return {
        index: i,
        segment: seg,
        remainingInSegment: end - elapsedSec,
        elapsedInSegment: elapsedSec - acc,
      }
    }
    acc = end
  }
  return {
    index: segments.length - 1,
    segment: segments[segments.length - 1],
    remainingInSegment: 0,
    elapsedInSegment: segments[segments.length - 1].durationSec,
  }
}
