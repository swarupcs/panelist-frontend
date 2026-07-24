// src/types/delivery.ts
// Spoken-delivery analytics for an interview session.

export interface DeliveryAnalytics {
  answersAnalysed: number
  totalWords: number
  totalSeconds: number
  wordsPerMinute: number | null
  avgAnswerWords: number
  filler: {
    count: number
    perHundredWords: number
    top: Array<{ phrase: string; count: number }>
  }
  hedging: { count: number; perHundredWords: number }
  deliveryScore: number
  tips: string[]
}
