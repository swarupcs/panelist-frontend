// src/api/srs.api.ts
//
// Spaced repetition.
//
// The backend has been scheduling reviews on every answered question since
// before this client existed — each answer feeds a quality score into an SM-2
// style schedule per category. Nothing surfaced it, so the work was invisible.

import api from './axios';

export interface DueReviewItem {
  id: string;
  category: string;
  /** SM-2 ease factor; lower means the topic has been harder to recall. */
  easeFactor: string | number;
  /** Days until the next review after the last successful recall. */
  interval: number;
  /** Successful recalls in a row. Resets to 0 on a poor answer. */
  repetitions: number;
  lastReviewed: string | null;
  nextReview: string;
  isRetired: boolean;
}

export const srsApi = {
  /** Categories whose next review date has passed. */
  getDue: async (limit = 10): Promise<DueReviewItem[]> => {
    const res = await api.get(`/srs/due?limit=${limit}`);
    return res.data.data;
  },
};
