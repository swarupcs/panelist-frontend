// src/types/p2p.ts

export type P2PMessageType = 
  | 'JOIN_QUEUE'
  | 'LEAVE_QUEUE'
  | 'MATCH_FOUND'
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'PEER_JOINED'
  | 'PEER_LEFT'
  | 'WEBRTC_OFFER'
  | 'WEBRTC_ANSWER'
  | 'WEBRTC_ICE_CANDIDATE'
  | 'CODE_UPDATE'
  | 'CURSOR_MOVE'
  | 'CHAT_MESSAGE'
  | 'SELECT_QUESTION'
  | 'SWAP_ROLES'
  | 'SUBMIT_FEEDBACK'
  | 'WHITEBOARD_SYNC'
  | 'EXECUTE_CODE'
  | 'CODE_OUTPUT'
  | 'GET_HINT'
  | 'HINT_RECEIVED'
  | 'START_TIMER'
  | 'TIMER_SYNC'
  | 'LANGUAGE_SYNC'
  | 'TAB_FOCUS_LOST'
  | 'EXCALIDRAW_SYNC'
  | 'EXCALIDRAW_POINTER_SYNC'
  | 'ANALYZE_WHITEBOARD'
  | 'WHITEBOARD_SNAPSHOT'
  | 'ERROR';

export interface P2PMessage {
  type: P2PMessageType;
  payload?: any;
}

export interface WebRTCSignalingData {
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}
