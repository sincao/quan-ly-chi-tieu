import { differenceInDays, endOfMonth, startOfMonth, isAfter, isBefore, parseISO } from 'date-fns'

/**
 * Tính toán số tiền an toàn để chi tiêu trong ngày hôm nay.
 * Công thức: (Ngân sách còn lại) / (Số ngày còn lại trong tháng)
 */
export function calculateDailySafeSpend(
  remainingBudget: number,
  currentDate: Date = new Date()
): number {
  const endOfCurrMonth = endOfMonth(currentDate)
  // Cộng thêm 1 để tính cả ngày hôm nay
  const remainingDays = differenceInDays(endOfCurrMonth, currentDate) + 1
  
  if (remainingDays <= 0) return remainingBudget
  return Math.max(0, remainingBudget / remainingDays)
}

/**
 * Tính toán Burn Rate (Tốc độ tiêu tiền trung bình mỗi ngày)
 */
export function calculateBurnRate(
  totalSpent: number,
  currentDate: Date = new Date()
): number {
  const startOfCurrMonth = startOfMonth(currentDate)
  const daysPassed = differenceInDays(currentDate, startOfCurrMonth) + 1
  
  if (daysPassed <= 0) return 0
  return totalSpent / daysPassed
}

/**
 * Dự đoán tổng chi tiêu vào cuối tháng dựa trên Burn Rate hiện tại
 */
export function projectEndOfMonthSpend(
  burnRate: number,
  currentDate: Date = new Date()
): number {
  const daysInMonth = differenceInDays(endOfMonth(currentDate), startOfMonth(currentDate)) + 1
  return burnRate * daysInMonth
}

/**
 * Xác định trạng thái tài chính (Health Status)
 */
export type FinancialStatus = 'healthy' | 'warning' | 'danger' | 'emergency'

export function getFinancialStatus(
  spent: number,
  budget: number,
  currentDate: Date = new Date()
): FinancialStatus {
  if (budget <= 0) return 'emergency'
  
  const progress = spent / budget
  const start = startOfMonth(currentDate)
  const end = endOfMonth(currentDate)
  const totalDays = differenceInDays(end, start) + 1
  const elapsedDays = differenceInDays(currentDate, start) + 1
  const monthProgress = elapsedDays / totalDays
  
  // Nếu tỷ lệ tiêu tiền vượt quá tỷ lệ thời gian quá nhiều
  if (progress > 1) return 'emergency'
  if (progress > monthProgress + 0.2) return 'danger'
  if (progress > monthProgress) return 'warning'
  
  return 'healthy'
}
