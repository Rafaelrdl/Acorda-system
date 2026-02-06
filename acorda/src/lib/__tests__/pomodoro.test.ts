import { describe, expect, it } from 'vitest'
import { getElapsedMs, getElapsedMinutes } from '../pomodoro'

describe('pomodoro timing helpers', () => {
  it('accumulates only when a segment is active', () => {
    const elapsed = getElapsedMs(2000, 1000, 500)
    expect(elapsed).toBe(1500)
  })

  it('keeps elapsed when paused', () => {
    const elapsed = getElapsedMs(2000, null, 1500)
    expect(elapsed).toBe(1500)
  })

  it('rounds minutes from milliseconds', () => {
    expect(getElapsedMinutes(61000)).toBe(1)
    expect(getElapsedMinutes(119000)).toBe(2)
  })
})
