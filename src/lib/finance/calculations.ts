import { differenceInDays, endOfMonth, startOfMonth, startOfDay, endOfDay } from 'date-fns'

/**
 * Tính toán số tiền an toàn để chi tiêu trong ngày hôm nay.
 * Công thức: (Ngân sách còn lại) / (Số ngày còn lại trong tháng)
 */
export function calculateDailySafeSpend(
  remainingBudget: number,
  currentDate: Date = new Date()
): number {
  const normalizedDate = startOfDay(currentDate)
  const endOfCurrMonth = endOfDay(endOfMonth(normalizedDate))
  
  // differenceInDays trả về số ngày trọn vẹn
  const remainingDays = differenceInDays(endOfCurrMonth, normalizedDate) + 1
  
  if (remainingDays <= 0) return remainingBudget
  return remainingBudget / remainingDays
}

/**
 * Tính toán Burn Rate (Tốc độ tiêu tiền trung bình mỗi ngày)
 */
export function calculateBurnRate(
  totalSpent: number,
  currentDate: Date = new Date()
): number {
  const normalizedDate = startOfDay(currentDate)
  const startOfCurrMonth = startOfDay(startOfMonth(normalizedDate))
  
  const daysPassed = differenceInDays(normalizedDate, startOfCurrMonth) + 1
  
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

/**
 * Tính toán số ngày liên tiếp (streak) ghi chép chi tiêu
 */
export function calculateStreak(transactions: { date: string }[]): number {
  if (!transactions || transactions.length === 0) return 0;

  // Lấy danh sách các ngày duy nhất, bắt đầu từ đầu ngày, sắp xếp giảm dần
  const dates = Array.from(
    new Set(
      transactions.map((t) => startOfDay(new Date(t.date)).getTime())
    )
  ).sort((a, b) => b - a);

  const today = startOfDay(new Date()).getTime();
  const yesterday = today - 86400000;

  // Nếu ngày gần nhất cũ hơn ngày hôm qua, streak là 0
  // Tuy nhiên, nếu user mới đăng ký và có giao dịch hôm nay, vẫn tính là 1
  if (dates[0] < yesterday) return 0;

  let streak = 1;
  if (dates.length === 1) return 1; // Ngay ngày đầu tiên có giao dịch là streak 1
  let currentCheck = dates[0];

  for (let i = 1; i < dates.length; i++) {
    if (dates[i] === currentCheck - 86400000) {
      streak++;
      currentCheck = dates[i];
    } else {
      break;
    }
  }

  return streak;
}
