// src/api/recording.api.ts
//
// Screen recording for an interview session.
//
// Chunks go up during the session rather than in one upload at the end: a
// closed tab or a crash would otherwise lose the entire recording, and the
// longer the interview, the more there is to lose.

import api from './axios'

export interface RecordingStartResponse {
  recordingId: string
  status: string
}

export const recordingApi = {
  /**
   * Begin recording. Called only after the candidate has agreed — the server
   * stores the consent timestamp, and no recording can exist without one.
   */
  start: async (sessionId: string): Promise<RecordingStartResponse> => {
    const res = await api.post(`/interview/${sessionId}/recording/start`)
    return res.data.data
  },

  /**
   * Send one chunk as raw bytes.
   *
   * Not multipart: MediaRecorder hands over a Blob every few seconds for the
   * length of the interview, and form encoding adds overhead to every one.
   */
  uploadChunk: async (recordingId: string, chunk: Blob): Promise<void> => {
    await api.post(`/interview/recordings/${recordingId}/chunk`, chunk, {
      headers: { 'Content-Type': 'video/webm' },
    })
  },

  complete: async (recordingId: string, durationSeconds: number) => {
    const res = await api.post(`/interview/recordings/${recordingId}/complete`, {
      durationSeconds,
    })
    return res.data.data
  },
}
