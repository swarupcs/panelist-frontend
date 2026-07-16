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
