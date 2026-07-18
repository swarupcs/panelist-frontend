// src/hooks/useSessionRecorder.ts
//
// Records an interview session and uploads it as it goes.
//
// Distinct from useScreenRecorder, which saves a .webm to the candidate's own
// Downloads folder. That is fine for someone reviewing their own practice, and
// useless for recruiter review — the person being assessed ends up holding the
// only copy.
//
// Uploads happen throughout the session. MediaRecorder is asked for a chunk
// every few seconds and each one is sent as it arrives, so a closed tab or a
// crash costs the last few seconds rather than the entire interview.

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { recordingApi } from '@/api/recording.api'

/**
 * How often MediaRecorder hands over data. Short enough that a crash loses
 * little, long enough not to make a request every second for an hour.
 */
const CHUNK_INTERVAL_MS = 5000

export type RecorderState = 'idle' | 'starting' | 'recording' | 'stopping' | 'stopped' | 'error'

export function useSessionRecorder(sessionId: string | undefined) {
  const [state, setState] = useState<RecorderState>('idle')
  const [uploadFailures, setUploadFailures] = useState(0)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordingIdRef = useRef<string | null>(null)
  const startedAtRef = useRef<number>(0)
  // Uploads are chained rather than fired in parallel: the server appends to a
  // single file, so chunks arriving out of order would interleave and corrupt
  // the result.
  const uploadChainRef = useRef<Promise<void>>(Promise.resolve())

  const stop = useCallback(async () => {
    if (!recorderRef.current || state === 'stopped' || state === 'idle') return
    setState('stopping')

    const recorder = recorderRef.current
    // Flush whatever has been captured since the last chunk before stopping,
    // so the final seconds are not lost.
    if (recorder.state !== 'inactive') {
      recorder.requestData()
      recorder.stop()
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())

    // Let the in-flight chunk uploads finish before finalising, or the server
    // would mark the recording complete while bytes are still arriving.
    await uploadChainRef.current

    const recordingId = recordingIdRef.current
    if (recordingId) {
      try {
        const seconds = Math.round((Date.now() - startedAtRef.current) / 1000)
        await recordingApi.complete(recordingId, seconds)
      } catch {
        // The session is over and the bytes are already stored. The server
        // marks an unfinalised recording as interrupted, so it stays playable
        // — not worth interrupting the candidate over.
      }
    }

    recorderRef.current = null
    streamRef.current = null
    recordingIdRef.current = null
    setState('stopped')
  }, [state])

  /**
   * Ask for the screen and start.
   *
   * Consent to *us* recording is collected by the caller before this runs;
   * this then triggers the browser's own picker, which is a second, unforgeable
   * consent step — the user chooses exactly what is shared and can refuse.
   */
  const start = useCallback(async (): Promise<boolean> => {
    if (!sessionId) return false
    setState('starting')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15 },
        // Captures what the candidate says while sharing, where the browser
        // and the chosen surface allow it.
        audio: true,
      })
    } catch {
      // Cancelling the picker is a refusal, not a failure. No toast: the user
      // knows what they just did.
      setState('idle')
      return false
    }

    try {
      const { recordingId } = await recordingApi.start(sessionId)
      recordingIdRef.current = recordingId
    } catch {
      stream.getTracks().forEach((t) => t.stop())
      setState('error')
      toast.error('Could not start recording. Your interview will continue unrecorded.')
      return false
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'

    const recorder = new MediaRecorder(stream, { mimeType })

    recorder.ondataavailable = (event) => {
      if (event.data.size === 0 || !recordingIdRef.current) return
      const id = recordingIdRef.current

      uploadChainRef.current = uploadChainRef.current
        .then(() => recordingApi.uploadChunk(id, event.data))
        .catch(() => {
          // One failed chunk is a gap, not a reason to stop: the rest of the
          // recording is still worth having. Counted so a persistent failure
          // becomes visible rather than silently producing an empty file.
          setUploadFailures((n) => n + 1)
        })
    }

    // Stopping the share from the browser's own bar ends the recording — the
    // user revoking permission has to actually stop it.
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      void stop()
    })

    recorder.start(CHUNK_INTERVAL_MS)
    recorderRef.current = recorder
    streamRef.current = stream
    startedAtRef.current = Date.now()
    setState('recording')
    return true
  }, [sessionId, stop])

  /**
   * Release the capture without waiting for the server.
   *
   * For unmount: the component is going away, so there is nothing to await
   * into, but the screen share must stop regardless — leaving it live after
   * the user has navigated away is a privacy problem, not an untidy one. The
   * server marks an unfinalised recording as interrupted, so what was captured
   * stays playable.
   */
  const stopSilently = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.requestData()
      recorder.stop()
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    recorderRef.current = null
    streamRef.current = null
  }, [])

  return {
    state,
    isRecording: state === 'recording',
    uploadFailures,
    start,
    stop,
    stopSilently,
  }
}
