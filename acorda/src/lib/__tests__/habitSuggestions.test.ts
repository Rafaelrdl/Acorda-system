import { describe, expect, it } from 'vitest'
import { normalizeTitle } from '../helpers'

describe('normalizeTitle', () => {
  it('removes leading and trailing whitespace', () => {
    expect(normalizeTitle('  Meditar  ')).toBe('meditar')
  })

  it('converts to lowercase', () => {
    expect(normalizeTitle('BEBER ÁGUA')).toBe('beber água')
  })

  it('collapses multiple spaces into one', () => {
    expect(normalizeTitle('Ler   10   min')).toBe('ler 10 min')
  })

  it('handles mixed case with extra spaces', () => {
    expect(normalizeTitle('  Caminhada  10   MIN  ')).toBe('caminhada 10 min')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeTitle('   ')).toBe('')
  })

  it('returns lowercase for simple input', () => {
    expect(normalizeTitle('Alongar')).toBe('alongar')
  })

  it('detects duplicates correctly', () => {
    const title1 = 'Beber Água'
    const title2 = '  beber  água  '
    const normalized1 = normalizeTitle(title1)
    const normalized2 = normalizeTitle(title2)
    expect(normalized1).toBe(normalized2)
  })
})
