// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { applyTheme, getSystemTheme } from '../appearance'

// ============================================================================
// Appearance / Theme – Tests
// ============================================================================

describe('applyTheme', () => {
  it('applies dark theme to document', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-appearance')).toBe('dark')
  })

  it('applies light theme to document', () => {
    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-appearance')).toBe('light')
  })

  it('toggles between themes correctly', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    
    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('getSystemTheme', () => {
  it('returns a valid theme value (light or dark)', () => {
    const theme = getSystemTheme()
    expect(['light', 'dark']).toContain(theme)
  })
})
