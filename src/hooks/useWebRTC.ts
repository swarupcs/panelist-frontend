import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import type { P2PMessage, ChatMessage } from '@/types/p2p';

interface UseWebRTCReturn {
  status: 'idle' | 'searching' | 'matched' | 'connected' | 'disconnected' | 'error';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  roomId: string | null;
  chatMessages: ChatMessage[];
  codeContent: string;
  codeOutput: string | null;
  isCodeRunning: boolean;
  role: 'INTERVIEWER' | 'INTERVIEWEE' | null;
  currentQuestion: any | null;
  incomingWhiteboardPatch: any | null;
  aiHint: { status: 'idle' | 'loading' | 'success' | 'error', text: string | null };
  joinQueue: (role: string, difficulty: string, language: string) => void;
  leaveQueue: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (text: string) => void;
  sendCodeUpdate: (code: string) => void;
  sendWhiteboardSync: (patch: any) => void;
  executeCode: (code: string) => void;
  getHint: () => void;
  selectQuestion: (question: any) => void;
  swapRoles: () => void;
  submitFeedback: (technicalRating: number, communicationRating: number, feedback: string) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTC(): UseWebRTCReturn {
  const { tokens, user } = useAuthStore();
  const token = tokens?.accessToken;
  
  const [status, setStatus] = useState<UseWebRTCReturn['status']>('idle');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [codeContent, setCodeContent] = useState<string>('');
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [role, setRole] = useState<'INTERVIEWER' | 'INTERVIEWEE' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [incomingWhiteboardPatch, setIncomingWhiteboardPatch] = useState<any | null>(null);
  const [aiHint, setAiHint] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', text: string | null }>({ status: 'idle', text: null });
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const rtcRef = useRef<RTCPeerConnection | null>(null);

  // Initialize WebSocket
  useEffect(() => {
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = import.meta.env.DEV 
      ? `ws://localhost:3000/p2p-ws?token=${token}`
      : `${protocol}//${window.location.host}/p2p-ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      const msg: P2PMessage = JSON.parse(event.data);

      switch (msg.type) {
        case 'MATCH_FOUND':
          setRoomId(msg.payload.roomId);
          setRole(msg.payload.role);
          setStatus('matched');
          break;
        case 'PEER_JOINED':
          // The other person joined. If we are already here, we can initiate the offer.
          initiateCall();
          break;
        case 'PEER_LEFT':
          setStatus('disconnected');
          if (rtcRef.current) rtcRef.current.close();
          setRemoteStream(null);
          break;
        case 'WEBRTC_OFFER':
          await handleOffer(msg.payload);
          break;
        case 'WEBRTC_ANSWER':
          await handleAnswer(msg.payload);
          break;
        case 'WEBRTC_ICE_CANDIDATE':
          await handleIceCandidate(msg.payload);
          break;
        case 'CHAT_MESSAGE':
          setChatMessages(prev => [...prev, msg.payload]);
          break;
        case 'CODE_UPDATE':
          setCodeContent(msg.payload.code);
          break;
        case 'SELECT_QUESTION':
          setCurrentQuestion(msg.payload.question);
          break;
        case 'SWAP_ROLES':
          setRole(prev => prev === 'INTERVIEWER' ? 'INTERVIEWEE' : 'INTERVIEWER');
          break;
        case 'CODE_OUTPUT':
          setIsCodeRunning(msg.payload.status === 'running');
          if (msg.payload.output) {
            setCodeOutput(msg.payload.output);
          } else if (msg.payload.status === 'running') {
            setCodeOutput('Running code...');
          }
          break;
        case 'WHITEBOARD_SYNC':
          setIncomingWhiteboardPatch(msg.payload.patch);
          break;
        case 'HINT_RECEIVED':
          setAiHint({
            status: msg.payload.status,
            text: msg.payload.hint || null
          });
          break;
      }
    };

    return () => {
      ws.close();
      if (rtcRef.current) rtcRef.current.close();
    };
  }, [token]);

  // Request Media Permissions
  const getMediaStream = async () => {
    if (localStream) return localStream;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices.', err);
      return null;
    }
  };

  const createPeerConnection = async () => {
    if (rtcRef.current) rtcRef.current.close();
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    rtcRef.current = pc;

    // Send ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWsMessage({ type: 'WEBRTC_ICE_CANDIDATE', payload: { candidate: event.candidate } });
      }
    };

    // Receive remote stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setStatus('connected');
      }
    };

    // Add local tracks to PC
    const stream = await getMediaStream();
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    return pc;
  };

  const initiateCall = async () => {
    const pc = await createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendWsMessage({ type: 'WEBRTC_OFFER', payload: { sdp: pc.localDescription } });
  };

  const handleOffer = async (payload: any) => {
    const pc = await createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendWsMessage({ type: 'WEBRTC_ANSWER', payload: { sdp: pc.localDescription } });
  };

  const handleAnswer = async (payload: any) => {
    if (rtcRef.current) {
      await rtcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }
  };

  const handleIceCandidate = async (payload: any) => {
    if (rtcRef.current && payload.candidate) {
      await rtcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  };

  const sendWsMessage = (msg: P2PMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  const joinQueue = useCallback((role: string, difficulty: string, language: string) => {
    setStatus('searching');
    sendWsMessage({ type: 'JOIN_QUEUE', payload: { role, difficulty, language } });
  }, []);

  const leaveQueue = useCallback(() => {
    setStatus('idle');
    sendWsMessage({ type: 'LEAVE_QUEUE' });
  }, []);

  const joinRoom = useCallback(async (roomId: string) => {
    setRoomId(roomId);
    await getMediaStream(); // Pre-warm camera
    sendWsMessage({ type: 'JOIN_ROOM', payload: { roomId } });
  }, []);

  const leaveRoom = useCallback(() => {
    setStatus('idle');
    setRoomId(null);
    setRole(null);
    setCurrentQuestion(null);
    setChatMessages([]);
    setCodeContent('');
    sendWsMessage({ type: 'LEAVE_ROOM' });
    if (rtcRef.current) rtcRef.current.close();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
  }, [localStream]);

  const sendMessage = useCallback((text: string) => {
    const msg = {
      id: Math.random().toString(36).substring(7),
      senderId: user?.id || 'me',
      text,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, msg]);
    sendWsMessage({ type: 'CHAT_MESSAGE', payload: msg });
  }, [user]);

  const sendCodeUpdate = useCallback((code: string) => {
    setCodeContent(code);
    sendWsMessage({ type: 'CODE_UPDATE', payload: { code } });
  }, []);

  const sendWhiteboardSync = useCallback((patch: any) => {
    sendWsMessage({ type: 'WHITEBOARD_SYNC', payload: { patch } });
  }, []);

  const executeCode = useCallback((code: string) => {
    setIsCodeRunning(true);
    sendWsMessage({ type: 'EXECUTE_CODE', payload: { roomId, code } });
  }, [roomId]);

  const getHint = useCallback(() => {
    if (currentQuestion) {
      sendWsMessage({ type: 'GET_HINT', payload: { question: currentQuestion.description, code: codeContent } });
    }
  }, [currentQuestion, codeContent]);

  const selectQuestion = useCallback((question: any) => {
    setCurrentQuestion(question);
    sendWsMessage({ type: 'SELECT_QUESTION', payload: { question } });
  }, []);

  const swapRoles = useCallback(() => {
    setRole(prev => prev === 'INTERVIEWER' ? 'INTERVIEWEE' : 'INTERVIEWER');
    sendWsMessage({ type: 'SWAP_ROLES', payload: {} });
  }, []);

  const submitFeedback = useCallback((technicalRating: number, communicationRating: number, feedback: string) => {
    sendWsMessage({ type: 'SUBMIT_FEEDBACK', payload: { roomId, technicalRating, communicationRating, feedback } });
  }, [roomId]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  return {
    status,
    localStream,
    remoteStream,
    roomId,
    chatMessages,
    codeContent,
    codeOutput,
    isCodeRunning,
    role,
    currentQuestion,
    incomingWhiteboardPatch,
    aiHint,
    joinQueue,
    leaveQueue,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendCodeUpdate,
    sendWhiteboardSync,
    executeCode,
    getHint,
    selectQuestion,
    swapRoles,
    submitFeedback,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled
  };
}
