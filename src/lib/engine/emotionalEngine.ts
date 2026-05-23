import { FinancialStatus } from '../finance/calculations'

export type ReactionType = 'roast' | 'encourage' | 'neutral'

export interface EmotionalReaction {
  message: string
  type: ReactionType
  avatarMood: 'happy' | 'stressed' | 'sad' | 'angry' | 'dead'
}

const ROASTS: Record<FinancialStatus, string[]> = {
  healthy: [
    "Cứ giữ phong độ này thì cuối tháng có thịt ăn nhé! 🥩",
    "Ví tiền của bạn đang cảm thấy rất bình yên. ✨",
    "Tuyệt vời! Bạn đang làm chủ đồng tiền đấy. 🫡"
  ],
  warning: [
    "Bắt đầu thấy ví hơi nhẹ rồi đấy nha... 👀",
    "Cẩn thận cái tay! Đừng để 'cháy túi' sớm. ✋",
    "Hơi quá tay rồi đấy, bớt bớt lại chút đi. 📉"
  ],
  danger: [
    "Báo động đỏ! Bạn đang tiêu tiền như thể không có ngày mai. 💀",
    "Trà sữa hay là sự tồn tại? Hãy chọn đi! 🥤❌",
    "Ví tiền của bạn đang yêu cầu hỗ trợ tâm lý khẩn cấp. 🆘",
    "Bạn định ăn mì tôm cả tháng sau à? 🍜"
  ],
  emergency: [
    "TOANG THỰC SỰ RỒI! 😱",
    "Game Over. Bạn đã tiêu hết sạch sinh mạng của tháng này. ⚰️",
    "Đừng nhìn tôi bằng ánh mắt đó, tôi không có tiền cho bạn mượn đâu. 💸",
    "Chế độ sinh tồn: KÍCH HOẠT. 🫡"
  ]
}

const AVATAR_MOODS: Record<FinancialStatus, EmotionalReaction['avatarMood']> = {
  healthy: 'happy',
  warning: 'stressed',
  danger: 'sad',
  emergency: 'dead'
}

/**
 * Engine tạo ra phản hồi cảm xúc dựa trên trạng thái tài chính
 */
export function generateEmotionalReaction(
  status: FinancialStatus,
  context?: { categoryName?: string; amount?: number }
): EmotionalReaction {
  const messages = ROASTS[status]
  const randomMessage = messages[Math.floor(Math.random() * messages.length)]
  
  return {
    message: randomMessage,
    type: status === 'healthy' ? 'encourage' : 'roast',
    avatarMood: AVATAR_MOODS[status]
  }
}
