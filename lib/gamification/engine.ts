/**
 * Cấu hình hệ thống XP và Level
 */
export const GAMIFICATION_CONFIG = {
  XP_PER_TRANSACTION: 10,
  XP_FIRST_DAILY_TRANSACTION: 50,
  XP_DAILY_SAFE_SPEND_BONUS: 100,
  MAX_DAILY_TRANSACTION_XP: 200, // Chống spam
  LEVEL_EXPONENT: 1.5,
  BASE_XP: 100,
}

/**
 * Tính toán Level dựa trên tổng XP
 * Công thức: Level = (XP / BaseXP) ^ (1 / Exponent)
 */
export function calculateLevel(totalXp: number): number {
  if (totalXp <= 0) return 1
  return Math.floor(Math.pow(totalXp / GAMIFICATION_CONFIG.BASE_XP, 1 / GAMIFICATION_CONFIG.LEVEL_EXPONENT)) + 1
}

/**
 * Tính toán XP cần thiết để đạt đến một Level cụ thể
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(GAMIFICATION_CONFIG.BASE_XP * Math.pow(level - 1, GAMIFICATION_CONFIG.LEVEL_EXPONENT))
}

/**
 * Lấy tên danh hiệu (Rank) dựa trên Level
 */
export function getRankName(level: number): string {
  if (level < 5) return 'Kẻ Sống Sót Tập Sự'
  if (level < 10) return 'Chiến Binh Tiết Kiệm'
  if (level < 20) return 'Bậc Thầy Ngân Sách'
  if (level < 50) return 'Huyền Thoại Tài Chính'
  return 'Thần Tài Tái Thế'
}

/**
 * Logic tính toán Streak (Chuỗi ngày)
 * Trả về true nếu streak được tiếp tục, false nếu bị gãy
 */
export function checkStreakStatus(lastActionDate: string, currentDate: string = new Date().toISOString()): {
  shouldIncrement: boolean,
  isBroken: boolean
} {
  const lastDate = new Date(lastActionDate).setHours(0, 0, 0, 0)
  const currDate = new Date(currentDate).setHours(0, 0, 0, 0)
  
  const diffInMs = currDate - lastDate
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

  if (diffInDays === 1) {
    return { shouldIncrement: true, isBroken: false }
  } else if (diffInDays === 0) {
    return { shouldIncrement: false, isBroken: false }
  } else {
    return { shouldIncrement: false, isBroken: true }
  }
}
