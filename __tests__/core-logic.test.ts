import { describe, it, expect } from 'vitest'
import { calculateDailySafeSpend, calculateBurnRate, getFinancialStatus } from '../src/lib/finance/calculations'
import { generateEmotionalReaction } from '../src/lib/engine/emotionalEngine'
import { calculateLevel, checkStreakStatus } from '../src/lib/gamification/engine'

describe('Finance Logic', () => {
  it('should calculate correct daily safe spend', () => {
    // 2026-05-15: 31 ngày. Còn 17 ngày (15, 16, ..., 31)
    const date = new Date(2026, 4, 15) // Tháng 5 (0-indexed là 4)
    const remainingBudget = 1700000 
    expect(calculateDailySafeSpend(remainingBudget, date)).toBe(100000)
  })

  it('should calculate correct burn rate', () => {
    // Ngày 10/05 -> Đã qua 10 ngày
    const date = new Date(2026, 4, 10)
    expect(calculateBurnRate(1000000, date)).toBe(100000)
  })

  it('should return correct financial status', () => {
    const date = new Date(2026, 4, 15) // Giữa tháng (~48%)
    const budget = 3000000
    
    // Tiêu 1tr (~33%) -> Healthy (33% < 48%)
    expect(getFinancialStatus(1000000, budget, date)).toBe('healthy')
    
    // Tiêu 1.8tr (~60%) -> Warning (60% > 48% và < 68%)
    expect(getFinancialStatus(1800000, budget, date)).toBe('warning')

    // Tiêu 2.5tr (~83%) -> Danger (83% > 68%)
    expect(getFinancialStatus(2500000, budget, date)).toBe('danger')
  })
})

describe('Emotional Engine', () => {
  it('should generate appropriate reaction for status', () => {
    const reaction = generateEmotionalReaction('danger')
    expect(reaction.type).toBe('roast')
    expect(reaction.avatarMood).toBe('sad')
    expect(typeof reaction.message).toBe('string')
  })
})

describe('Gamification Engine', () => {
  it('should calculate correct level based on XP', () => {
    expect(calculateLevel(0)).toBe(1)
    expect(calculateLevel(100)).toBe(2) // 100 * (1^1.5)
  })

  it('should detect streak status correctly', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const result = checkStreakStatus(yesterday.toISOString())
    expect(result.shouldIncrement).toBe(true)
    expect(result.isBroken).toBe(false)
    
    const longAgo = '2020-01-01'
    const brokenResult = checkStreakStatus(longAgo)
    expect(brokenResult.isBroken).toBe(true)
  })
})
