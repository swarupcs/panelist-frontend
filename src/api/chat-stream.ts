// src/api/chat-stream.ts
//
// Streaming client for the AI coach. EventSource can't do POST or send an auth
// header, so this uses fetch + a ReadableStream reader and parses the SSE frames
// itself. Falls back to the blocking /query endpoint is the caller's job — this
// throws on a transport failure so the caller can retry non-streamed.

import { getAccessToken } from './access-token'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export interface StreamQueryParams {
  query: string
  userId: string
  sessionId?: string
  useRAG?: boolean
}

export interface StreamMeta {
  agentType?: string
  sessionId?: string
  confidence?: number
}

export interface StreamDone {
  agentType?: string
  confidence?: number
  suggestedFollowUps?: string[]
  sessionId?: string
}

export interface StreamHandlers {
  onMeta?: (meta: StreamMeta) => void
  onToken: (delta: string) => void
  onDone?: (done: StreamDone) => void
  signal?: AbortSignal
}

/**
 * POST to /query/stream and dispatch SSE events. Resolves when the stream ends.
 * Throws if the request can't be made or the server returns a non-OK status, so
 * the caller can fall back to the blocking endpoint.
 */
export async function streamQuery(
  params: StreamQueryParams,
  handlers: StreamHandlers,
): Promise<void> {
  const token = getAccessToken()
  const res = await fetch(`${BASE_URL}/query/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(params),
    signal: handlers.signal,
  })

  if (!res.ok || !res.body) {
    throw new Error(`Stream request failed: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let sawError: string | null = null

  const dispatch = (payload: string) => {
    let event: Record<string, unknown>
    try {
      event = JSON.parse(payload)
    } catch {
      return // ignore malformed frames
    }
    switch (event.type) {
      case 'meta':
        handlers.onMeta?.(event as StreamMeta)
        break
      case 'token':
        if (typeof event.content === 'string') handlers.onToken(event.content)
        break
      case 'done':
        handlers.onDone?.(event as StreamDone)
        break
      case 'error':
        sawError = typeof event.message === 'string' ? event.message : 'stream error'
        break
    }
  }

  // SSE frames are separated by a blank line; each `data:` line carries JSON.
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sep: number
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      for (const line of frame.split('\n')) {
        if (line.startsWith('data:')) dispatch(line.slice(5).trim())
      }
    }
  }

  if (sawError) throw new Error(sawError)
}
