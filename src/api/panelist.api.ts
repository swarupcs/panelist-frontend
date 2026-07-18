// src/api/panelist.api.ts
//
// The session-aware interview endpoints.
//
// Note the difference from codeApi.execute in interview-extended.api.ts: that
// one runs code and returns results, full stop. These routes belong to a
// session, so a submission is recorded on the transcript, evaluated against the
// real execution results, and answered with a follow-up question. Use these
// during an interview; use codeApi.execute for a scratch run.

import api from './axios';
import type {
  AnswerFollowUpRequest,
  AnswerFollowUpResponse,
  InterviewReport,
  RecruiterDossier,
  SubmitCodeRequest,
  SubmitCodeResponse,
  SubmitDrawingRequest,
  SubmitDrawingResponse,
  TranscriptResponse,
} from '@/types/panelist';

export const panelistApi = {
  /**
   * Run a submission against the question's stored test cases and, when
   * `final` is not false, have the interviewer evaluate it.
   *
   * Test cases are resolved server-side from the question, so the client does
   * not choose what it is graded against.
   */
  submitCode: async (
    sessionId: string,
    data: SubmitCodeRequest,
  ): Promise<SubmitCodeResponse> => {
    const res = await api.post(`/panelist/sessions/${sessionId}/code`, data);
    return res.data.data;
  },

  /**
   * Answer (or skip) the interviewer's follow-up. Records the reply and
   * advances the interview.
   */
  answerFollowUp: async (
    sessionId: string,
    data: AnswerFollowUpRequest,
  ): Promise<AnswerFollowUpResponse> => {
    const res = await api.post(`/panelist/sessions/${sessionId}/follow-up`, data);
    return res.data.data;
  },

  /** Submit an Excalidraw scene for evaluation. */
  submitDrawing: async (
    sessionId: string,
    data: SubmitDrawingRequest,
  ): Promise<SubmitDrawingResponse> => {
    const res = await api.post(`/panelist/sessions/${sessionId}/drawing`, data);
    return res.data.data;
  },

  /** Full ordered event log for the session. */
  getTranscript: async (sessionId: string): Promise<TranscriptResponse> => {
    const res = await api.get(`/panelist/sessions/${sessionId}/transcript`);
    return res.data.data;
  },

  /**
   * The end-of-session report. Generated on session completion, so this is
   * normally a cached read; it generates on demand if that has not happened.
   */
  getReport: async (sessionId: string): Promise<InterviewReport> => {
    const res = await api.get(`/panelist/sessions/${sessionId}/report`);
    return res.data.data;
  },

  /** Force regeneration — use when a report comes back marked stale. */
  regenerateReport: async (sessionId: string): Promise<InterviewReport> => {
    const res = await api.post(`/panelist/sessions/${sessionId}/report`);
    return res.data.data;
  },
};

export const recruiterApi = {
  /** Everything a hiring team sees for one session. */
  getDossier: async (sessionId: string): Promise<RecruiterDossier> => {
    const res = await api.get(`/recruiter/sessions/${sessionId}`);
    return res.data.data;
  },
};
