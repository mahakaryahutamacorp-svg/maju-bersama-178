import { describe, it, expect } from 'vitest'
import { formatRp } from '../lib/mb178/format'

describe('formatRp', () => {
  it('formats positive numbers correctly', () => {
    expect(formatRp(1000)).toBe('Rp1.000')
    expect(formatRp(1500500)).toBe('Rp1.500.500')
  })

  it('handles zero correctly', () => {
    expect(formatRp(0)).toBe('Rp0')
  })

  it('handles small amounts', () => {
    expect(formatRp(50)).toBe('Rp50')
  })
})
