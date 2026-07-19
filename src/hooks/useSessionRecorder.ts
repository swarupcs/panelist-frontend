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
//
// Two streams when the interview asks for a camera: the screen and the
// candidate. Captured and uploaded independently, because they fail
// independently — a refused camera permission must not cost the screen
// recording, and a candidate whose webcam is already in use should still have
// their work recorded.

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { recordingApi, type RecordingKind } from '@/api/recording.api'

/**
 * How often MediaRecorder hands over data. Short enough that a crash loses
 * little, long enough not to make a request every second for an hour.
 */
const CHUNK_INTERVAL_MS = 5000

/**
 * How many chunks in a row may fail before the candidate is told.
 *
 * One lost chunk is a few seconds of gap and not worth interrupting an
 * interview over. Several in a row means the recording is being quietly
 * hollowed out, and someone sitting an assessment deserves to know that before
 * they finish rather than after.
 */
const CONSECUTIVE_FAILURES_BEFORE_WARNING = 3

export type RecorderState = 'idle' | 'starting' | 'recording' | 'stopping' | 'stopped' | 'error'

/**
 * One stream in flight.
 *
 * The upload chain is per stream, not shared: the server appends each kind to
 * its own file, so screen and camera chunks may travel at the same time — but
 * within one stream they must stay in order, or the file interleaves and
 * corrupts.
 */
interface Track {
  kind: RecordingKind
  recorder: MediaRecorder
  stream: MediaStream
  recordingId: string
  uploadChain: Promise<void>
}

function preferredMimeType(): string {
  return MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm'
}

export function useSessionRecorder(sessionId: string | undefined) {
  const [state, setState] = useState<RecorderState>('idle')
  const [uploadFailures, setUploadFailures] = useState(0)
  const [uploadDegraded, setUploadDegraded] = useState(false)
  /** The interview asked for a camera and it could not be captured. */
  const [cameraMissing, setCameraMissing] = useState(false)
  const [isRecordingCamera, setIsRecordingCamera] = useState(false)

  const tracksRef = useRef<Track[]>([])
  const startedAtRef = useRef(0)

  // Consecutive rather than total: a single failure early on says nothing
  // about whether uploads are working now.
  const consecutiveFailuresRef = useRef(0)
  const warnedRef = useRef(false)

  /** Upload this stream's chunks in order, and count what is lost. */
  const wireUploads = useCallback((track: Track) => {
    track.recorder.ondataavailable = (event) => {
      if (event.data.size === 0) return

      track.uploadChain = track.uploadChain
        .then(async () => {
          // recordingApi.uploadChunk retries transient failures internally.
          // Retrying here instead would break ordering within this stream.
          await recordingApi.uploadChunk(track.recordingId, event.data)

          consecutiveFailuresRef.current = 0
          if (warnedRef.current) {
            warnedRef.current = false
            setUploadDegraded(false)
          }
        })
        .catch(() => {
          // One failed chunk is a gap, not a reason to stop.
          setUploadFailures((n) => n + 1)
          consecutiveFailuresRef.current += 1

          if (
            consecutiveFailuresRef.current >= CONSECUTIVE_FAILURES_BEFORE_WARNING &&
            !warnedRef.current
          ) {
            // Said once, not once per chunk. A toast every five seconds during
            // a network problem is its own distraction, mid-interview.
            warnedRef.current = true
            setUploadDegraded(true)
            toast.warning(
              'Parts of your recording are not uploading. Your interview is not affected.',
            )
          }
        })
    }
  }, [])

  const stop = useCallback(async () => {
    if (tracksRef.current.length === 0) return
    setState('stopping')

    const tracks = tracksRef.current
    tracksRef.current = []
    setIsRecordingCamera(false)

    for (const track of tracks) {
      // Flush whatever has been captured since the last chunk, so the final
      // seconds are not lost.
      if (track.recorder.state !== 'inactive') {
        track.recorder.requestData()
        track.recorder.stop()
      }
      track.stream.getTracks().forEach((t) => t.stop())
    }

    // Let in-flight uploads finish before finalising, or the server would mark
    // a recording complete while its bytes were still arriving.
    await Promise.all(tracks.map((t) => t.uploadChain))

    const seconds = Math.round((Date.now() - startedAtRef.current) / 1000)
    await Promise.all(
      tracks.map((track) =>
        recordingApi.complete(track.recordingId, seconds).catch(() => {
          // The session is over and the bytes are stored. The server marks an
          // unfinalised recording as interrupted, so it stays playable — not
          // worth interrupting the candidate over.
        }),
      ),
    )

    setState('stopped')
  }, [])

  /**
   * Release capture without waiting for the server.
   *
   * For unmount: the component is going away, so there is nothing to await
   * into, but the camera light and the screen share must stop regardless —
   * leaving either live after the user has navigated away is a privacy
   * problem, not an untidy one.
   */
  const stopSilently = useCallback(() => {
    for (const track of tracksRef.current) {
      if (track.recorder.state !== 'inactive') {
        track.recorder.requestData()
        track.recorder.stop()
      }
      track.stream.getTracks().forEach((t) => t.stop())
    }
    tracksRef.current = []
  }, [])

  /** Begin one stream. Null when it could not be started. */
  const beginTrack = useCallback(
    async (kind: RecordingKind, stream: MediaStream): Promise<Track | null> => {
      if (!sessionId) return null

      let recordingId: string
      try {
        const started = await recordingApi.start(sessionId, kind)
        recordingId = started.recordingId
      } catch {
        stream.getTracks().forEach((t) => t.stop())
        return null
      }

      const recorder = new MediaRecorder(stream, { mimeType: preferredMimeType() })
      const track: Track = {
        kind,
        recorder,
        stream,
        recordingId,
        uploadChain: Promise.resolve(),
      }

      wireUploads(track)

      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        // Only the screen ending ends the recording. A camera unplugged
        // mid-answer should not throw the screen recording away with it.
        if (kind === 'SCREEN') void stop()
      })

      recorder.start(CHUNK_INTERVAL_MS)
      return track
    },
    [sessionId, stop, wireUploads],
  )

  /**
   * Ask for the screen — and the camera, when the interview requires it.
   *
   * Consent to *us* recording is collected by the caller before this runs. The
   * browser's own prompts are a second, unforgeable step: the user picks
   * exactly what is shared and can refuse.
   */
  const start = useCallback(
    async (options: { camera?: boolean } = {}): Promise<boolean> => {
      if (!sessionId) return false
      setState('starting')
      setCameraMissing(false)

      let display: MediaStream
      try {
        display = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 15 },
          // Captures what the candidate says while sharing, where the browser
          // and the chosen surface allow it.
          audio: true,
        })
      } catch {
        // Cancelling the picker is a refusal, not a failure. No toast: the
        // user knows what they just did.
        setState('idle')
        return false
      }

      const screenTrack = await beginTrack('SCREEN', display)
      if (!screenTrack) {
        setState('error')
        toast.error('Could not start recording. Your interview will continue unrecorded.')
        return false
      }

      const tracks: Track[] = [screenTrack]

      if (options.camera) {
        try {
          const camera = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, frameRate: 15 },
            // The screen share already carries audio where the browser allows
            // it. A second microphone stream would double the voice and the
            // upload for nothing.
            audio: false,
          })

          const cameraTrack = await beginTrack('CAMERA', camera)
          if (cameraTrack) {
            tracks.push(cameraTrack)
            setIsRecordingCamera(true)
          } else {
            setCameraMissing(true)
          }
        } catch {
          // Refused, unavailable, or already in use. The screen recording
          // stands: losing it because a webcam was busy would be a far worse
          // outcome than a missing camera stream.
          setCameraMissing(true)
          toast.warning('Your camera could not be started. The interview continues.')
        }
      }

      tracksRef.current = tracks
      startedAtRef.current = Date.now()
      consecutiveFailuresRef.current = 0
      warnedRef.current = false
      setUploadDegraded(false)
      setState('recording')
      return true
    },
    [sessionId, beginTrack],
  )

  return {
    state,
    isRecording: state === 'recording',
    uploadFailures,
    /** Chunks are being lost right now — the recording will have gaps. */
    uploadDegraded,
    cameraMissing,
    isRecordingCamera,
    start,
    stop,
    stopSilently,
  }
}
