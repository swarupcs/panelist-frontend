// src/hooks/useIntegrityMonitor.ts
//
// Captures interview integrity / proctoring signals from the candidate's
// browser and flushes them to the backend in batches.
//
// What it watches:
//   - window blur / focus      → FOCUS_LOST / FOCUS_RETURNED (with time away)
//   - tab visibility change     → TAB_HIDDEN / TAB_VISIBLE (with time away)
//   - paste into the page       → PASTE (with character count)
//   - copy from the page        → COPY
//   - leaving fullscreen        → FULLSCREEN_EXIT
//
// Everything is best-effort: a failed flush is swallowed so monitoring can
// never interrupt the interview. Events buffer client-side and flush on a timer
// and when the page is hidden/unloaded.

import { useEffect, useRef } from 'react'
import { panelistApi } from '@/api/panelist.api'

interface BufferedEvent {
  type: string
  occurredAt: string
  metadata?: Record<string, number>
}

const FLUSH_INTERVAL_MS = 10_000

export function useIntegrityMonitor(sessionId: string | undefined, enabled: boolean) {
  const buffer = useRef<BufferedEvent[]>([])
  // When the candidate left the surface, so we can report how long they were away.
  const awaySince = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !sessionId) return

    const push = (type: string, metadata?: Record<string, number>) => {
      buffer.current.push({ type, occurredAt: new Date().toISOString(), metadata })
    }

    const flush = () => {
      if (buffer.current.length === 0) return
      const batch = buffer.current
      buffer.current = []
      // Fire and forget — never surface a monitoring failure to the candidate.
      panelistApi.recordIntegrityEvents(sessionId, batch).catch(() => {
        // Drop on failure rather than retrying; a lost signal is acceptable.
      })
    }

    const markAway = () => {
      if (awaySince.current === null) awaySince.current = Date.now()
    }
    const awayMs = (): Record<string, number> | undefined => {
      if (awaySince.current === null) return undefined
      const ms = Date.now() - awaySince.current
      awaySince.current = null
      return ms > 0 ? { awayMs: ms } : undefined
    }

    const onBlur = () => { markAway(); push('FOCUS_LOST') }
    const onFocus = () => push('FOCUS_RETURNED', awayMs())
    const onVisibility = () => {
      if (document.hidden) { markAway(); push('TAB_HIDDEN') }
      else push('TAB_VISIBLE', awayMs())
    }
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') ?? ''
      push('PASTE', { chars: text.length })
    }
    const onCopy = () => push('COPY')
    const onFullscreen = () => {
      if (!document.fullscreenElement) push('FULLSCREEN_EXIT')
    }
    const onPageHide = () => flush()

    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('paste', onPaste, true)
    document.addEventListener('copy', onCopy, true)
    document.addEventListener('fullscreenchange', onFullscreen)
    window.addEventListener('pagehide', onPageHide)

    const interval = window.setInterval(flush, FLUSH_INTERVAL_MS)

    return () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('paste', onPaste, true)
      document.removeEventListener('copy', onCopy, true)
      document.removeEventListener('fullscreenchange', onFullscreen)
      window.removeEventListener('pagehide', onPageHide)
      window.clearInterval(interval)
      flush()
    }
  }, [enabled, sessionId])
}
