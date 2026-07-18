# Panelist — Frontend

_AI interview platform. Real code execution, real system-design drawing, real AI judgment._

React 19 + Vite + TypeScript, Tailwind v4, shadcn/ui. This README reflects what's actually in the codebase (verified against `src/`), not aspirational copy — the previous README was the default Vite template and didn't describe the app at all.

## What's actually built

**Interview flow** (`src/pages/interview/`) — full page set already exists: `InterviewSetupPage`, `InterviewSessionPage`, `InterviewCompletePage`, `InterviewResultsPage`, `InterviewHistoryPage`, `InterviewComparePage`, `InterviewReplayPage`, and a `VoiceInterviewPage`.

**Code editor** (`src/components/interview/`) — `MultiFileEditor.tsx` (Monaco-based) and `CodeExecutionPanel.tsx` for running/showing results, `SessionTimer.tsx`, `QuestionRating.tsx`, `ShareScorecardModal.tsx`.

**Voice UI** (`src/components/interview/voice/`) — `VoiceStatusBadge.tsx` and `WaveformVisualizer.tsx` already scaffolded, plus the dedicated `VoiceInterviewPage.tsx`. These are UI-ready; they currently expect a backend that does live STT/TTS, which the backend doesn't fully provide yet (see backend README).

**Drawing** — `@excalidraw/excalidraw` and `tldraw` are both installed as dependencies, but there is no component in `src/components/interview/` yet that embeds either canvas into the interview flow. This is the main missing piece for the System Design track.

**Everything else** — full admin panel (`src/components/admin/`), analytics charts (`recharts`-based), gamification pages, forum, study groups, P2P practice, learning/topics pages, onboarding, auth pages. State via Redux Toolkit + redux-persist, server state via TanStack Query.

## What Panelist (hackathon vision) still needs

1. **Excalidraw canvas component for System Design track** — new component, e.g. `src/components/interview/DrawingCanvas.tsx`, embedding `@excalidraw/excalidraw`, capturing scene JSON on submit, posting it to the new backend endpoint (see backend README item 2).
2. **Wire `VoiceInterviewPage.tsx` to real audio** — once the backend adds an OpenAI Realtime API bridge, this page needs actual `getUserMedia` capture + WebRTC/WebSocket streaming, replacing whatever mock/placeholder currently drives `WaveformVisualizer`.
3. **Recruiter view page** — no page exists yet for a non-candidate viewer. Likely reuses `InterviewReplayPage.tsx`'s data-fetching pattern against the new backend recruiter endpoint, with a simpler read-only layout (transcript + rating, no controls).
4. **Confirm Codebox swap surfaces correctly in `CodeExecutionPanel.tsx`** — once the backend swaps its execution provider, verify the response shape still matches what this component expects (test case results, execution time, memory) — likely no change needed if the backend keeps the same response contract.

## Priority order for a 2-day build window
Day 1: (1) Excalidraw canvas + wiring to the new backend endpoint.
Day 2: (3) recruiter view (reuse replay page pattern), then (2) voice wiring only if backend's Realtime bridge is ready in time.