// src/api/recording.api.ts
//
// Screen recording for an interview session.
//
// Chunks go up during the session rather than in one upload at the end: a
// closed tab or a crash would otherwise lose the entire recording, and the
// longer the interview, the more there is to lose.

import type { AxiosError } from 'axios'
import api from './axios'

/**
 * What is being recorded. The server keeps one of each per session, so the
 * screen and the camera are independent recordings rather than one stream.
 */
export type RecordingKind = 'SCREEN' | 'CAMERA'

export interface RecordingStartResponse {
  recordingId: string
  status: string
  kind: RecordingKind
}

/**
 * Attempts per chunk, including the first.
 *
 * Bounded deliberately. Chunks arrive every few seconds and are uploaded in
 * order, so a chunk that retries for a long time holds up every chunk behind
 * it — each one sitting in memory as a Blob. Three attempts with short backoff
 * costs at most a few seconds and covers the case this exists for: a brief
 * blip, a dropped packet, a moment of wifi.
 */
const MAX_ATTEMPTS = 3

/** Base backoff. Doubles each attempt, with jitter. */
const RETRY_BASE_MS = 400

/**
 * Whether another attempt could plausibly succeed.
 *
 * A network failure or a 5xx might. A 413 (chunk too large), 409 (recording
 * already finished) or 404 will fail identically every time — retrying those
 * just delays the inevitable and holds up the chunks behind them.
 */
function isRetryable(error: unknown): boolean {
  const status = (error as AxiosError)?.response?.status

  // No response at all: the request never reached the server. Offline, DNS,
  // connection reset — exactly what retrying is for.
  if (status === undefined) return true

  if (status === 408 || status === 429) return true
  return status >= 500
}

function backoffMs(attempt: number): number {
  // Jittered so several tabs recovering from the same outage do not retry in
  // lockstep.
  const base = RETRY_BASE_MS * 2 ** (attempt - 1)
  return base + Math.random() * RETRY_BASE_MS
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const recordingApi = {
  /**
   * Begin recording. Called only after the candidate has agreed — the server
   * stores the consent timestamp, and no recording can exist without one.
   */
  start: async (
    sessionId: string,
    kind: RecordingKind = 'SCREEN',
  ): Promise<RecordingStartResponse> => {
    // The kind has to be sent. Without it the server defaults to SCREEN, so
    // starting the camera created a second screen recording and was rejected
    // for already having one — the camera silently never recorded.
    const res = await api.post(`/interview/${sessionId}/recording/start`, { kind })
    return res.data.data
  },

  /**
   * Send one chunk as raw bytes, retrying a failure that might be transient.
   *
   * Not multipart: MediaRecorder hands over a Blob every few seconds for the
   * length of the interview, and form encoding adds overhead to every one.
   *
   * Retries happen here rather than in the caller because the caller uploads
   * chunks strictly in order — the server appends them to a single file — so a
   * retry has to finish before the next chunk is sent. Retrying outside that
   * ordering would interleave chunks and corrupt the recording.
   *
   * @throws the last error when every attempt fails. The caller decides what a
   * lost chunk means; this only decides whether to try again.
   */
  uploadChunk: async (recordingId: string, chunk: Blob): Promise<void> => {
    let lastError: unknown

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await api.post(`/interview/recordings/${recordingId}/chunk`, chunk, {
          headers: { 'Content-Type': 'video/webm' },
        })
        return
      } catch (error) {
        lastError = error
        if (!isRetryable(error) || attempt === MAX_ATTEMPTS) break
        await delay(backoffMs(attempt))
      }
    }

    throw lastError
  },

  /**
   * Delete a recording, and the file behind it.
   *
   * Only the person who was recorded can do this — consent that cannot be
   * withdrawn is not really consent.
   */
  remove: async (recordingId: string): Promise<{ deleted: boolean }> => {
    const res = await api.delete(`/interview/recordings/${recordingId}`)
    return res.data.data
  },

  complete: async (recordingId: string, durationSeconds: number) => {
    const res = await api.post(`/interview/recordings/${recordingId}/complete`, {
      durationSeconds,
    })
    return res.data.data
  },
}
