export function getElapsedMs(
  now: number,
  segmentStartedAt: number | null,
  accumulatedMs: number
): number {
  if (!segmentStartedAt) return accumulatedMs
  return accumulatedMs + Math.max(0, now - segmentStartedAt)
}

export function getElapsedMinutes(elapsedMs: number): number {
  return Math.round(elapsedMs / 60000)
}
