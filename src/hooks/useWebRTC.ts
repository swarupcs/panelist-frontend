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
  editorLanguage: string;
  role: 'INTERVIEWER' | 'INTERVIEWEE' | null;
  currentQuestion: any | null;
  incomingWhiteboardPatch: any | null;
  incomingExcalidrawElements: any | null;
  incomingExcalidrawPointer: any | null;
  incomingWhiteboardCamera: any | null;
  aiHint: { status: 'idle' | 'loading' | 'success' | 'error', text: string | null } | null;
  complexityResult: {
    status: 'idle' | 'loading' | 'success' | 'error';
    data?: {
      timeComplexity: string;
      spaceComplexity: string;
      explanation: string;
      canBeOptimized: boolean;
      optimalTimeComplexity: string;
      problemLines: number[];
      optimizationHint: string | null;
    };
  };
  interviewEndTime: number | null;
  joinQueue: (role: string, difficulty: string, language: string) => void;
  leaveQueue: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (text: string) => void;
  sendCodeUpdate: (code: string) => void;
  sendWhiteboardSync: (patch: any) => void;
  sendExcalidrawSync: (elements: any) => void;
  sendExcalidrawPointerSync: (pointer: any) => void;
  sendWhiteboardCameraSync: (camera: any) => void;
  sendAnalyzeWhiteboard: (image: string) => void;
  sendSaveSnapshots: (roomId: string, code: string, whiteboard: string) => void;
  setLanguage: (lang: string) => void;
  reportFocusLoss: () => void;
  executeCode: (code: string, testCases?: any[]) => void;
  getHint: () => void;
  getSocraticDebug: (output: string) => void;
  getComplexityAnalysis: () => void;
  getOptimizationChallenge: () => void;
  startTimer: (durationMinutes?: number) => void;
  selectQuestion: (question: any) => void;
  swapRoles: () => void;
  submitFeedback: (technicalRating: number, communicationRating: number, feedback: string) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'good' | 'fair' | 'poor' | null;
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
  const [editorLanguage, setEditorLanguage] = useState<string>('javascript');
  const [role, setRole] = useState<'INTERVIEWER' | 'INTERVIEWEE' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [incomingWhiteboardPatch, setIncomingWhiteboardPatch] = useState<any>(null);
  const [incomingExcalidrawElements, setIncomingExcalidrawElements] = useState<readonly any[] | null>(null);
  const [incomingExcalidrawPointer, setIncomingExcalidrawPointer] = useState<any>(null);
  const [incomingWhiteboardCamera, setIncomingWhiteboardCamera] = useState<any>(null);
  const [aiHint, setAiHint] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', text: string | null }>({ status: 'idle', text: null });
  const [complexityResult, setComplexityResult] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    data?: any;
  }>({ status: 'idle' });
  const [interviewEndTime, setInterviewEndTime] = useState<number | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor' | null>(null);
  const originalVideoTrack = useRef<MediaStreamTrack | null>(null);

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
        case 'EXCALIDRAW_SYNC':
          setIncomingExcalidrawElements(msg.payload.elements);
          break;
        case 'EXCALIDRAW_POINTER_SYNC':
          setIncomingExcalidrawPointer(msg.payload.pointer);
          break;
        case 'WHITEBOARD_CAMERA_SYNC':
          setIncomingWhiteboardCamera(msg.payload.camera);
          break;
        case 'COMPLEXITY_RESULT':
          setComplexityResult({
            status: msg.payload.status,
            data: msg.payload.data
          });
          break;
        case 'HINT_RECEIVED':
          setAiHint({
            status: msg.payload.status,
            text: msg.payload.hint || null
          });
          break;
        case 'TIMER_SYNC':
          setInterviewEndTime(msg.payload.endTime);
          break;
        case 'LANGUAGE_SYNC':
          setEditorLanguage(msg.payload.language);
          break;
        case 'TAB_FOCUS_LOST':
          setChatMessages(prev => [...prev, {
            id: Math.random().toString(),
            senderId: 'SYSTEM',
            text: `⚠️ PROCTOR ALERT: Candidate switched tabs or lost window focus at ${new Date().toLocaleTimeString()}`,
            timestamp: new Date().toISOString()
          }]);
          break;
      }
    };

    return () => {
      ws.close();
      if (rtcRef.current) rtcRef.current.close();
    };
  }, [token]);

  // Monitor WebRTC Stats
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'connected' && rtcRef.current) {
      interval = setInterval(async () => {
        if (!rtcRef.current) return;
        try {
          const stats = await rtcRef.current.getStats();
          let rtt = 0;
          let packetLoss = 0;
          
          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              rtt = report.currentRoundTripTime || 0;
            }
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              const packetsLost = report.packetsLost || 0;
              const packetsReceived = report.packetsReceived || 1;
              packetLoss = packetsLost / (packetsLost + packetsReceived);
            }
          });

          // rtt is in seconds in some browsers, others in ms. Usually it's in seconds for currentRoundTripTime.
          // Let's assume rtt > 0.3s (300ms) or packetLoss > 0.05 (5%) is poor.
          if (rtt > 0.3 || packetLoss > 0.05) {
            setConnectionQuality('poor');
          } else if (rtt > 0.15 || packetLoss > 0.02) {
            setConnectionQuality('fair');
          } else {
            setConnectionQuality('good');
          }
        } catch (err) {
          // Ignore
        }
      }, 2000);
    } else {
      setConnectionQuality(null);
    }
    return () => clearInterval(interval);
  }, [status]);

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

  const sendExcalidrawSync = useCallback((elements: any) => {
    sendWsMessage({ type: 'EXCALIDRAW_SYNC', payload: { elements } });
  }, []);

  const sendExcalidrawPointerSync = useCallback((pointer: any) => {
    sendWsMessage({ type: 'EXCALIDRAW_POINTER_SYNC', payload: { pointer } });
  }, []);

  const sendAnalyzeWhiteboard = useCallback((image: string) => {
    sendWsMessage({ type: 'ANALYZE_WHITEBOARD', payload: { image } });
  }, []);

  const sendWhiteboardCameraSync = useCallback((camera: any) => {
    sendWsMessage({ type: 'WHITEBOARD_CAMERA_SYNC', payload: { camera } });
  }, []);

  const sendSaveSnapshots = useCallback((roomId: string, code: string, whiteboard: string) => {
    sendWsMessage({ type: 'SAVE_SNAPSHOTS', payload: { roomId, code, whiteboard } });
  }, []);

  const setLanguage = useCallback((language: string) => {
    setEditorLanguage(language);
    sendWsMessage({ type: 'LANGUAGE_SYNC', payload: { language } });
  }, []);

  const reportFocusLoss = useCallback(() => {
    sendWsMessage({ type: 'TAB_FOCUS_LOST', payload: {} });
  }, []);

  const executeCode = useCallback((code: string, testCases?: any[]) => {
    setIsCodeRunning(true);
    sendWsMessage({ type: 'EXECUTE_CODE', payload: { roomId, code, testCases } });
  }, [roomId]);

  const getHint = useCallback(() => {
    if (currentQuestion) {
      sendWsMessage({ type: 'GET_HINT', payload: { question: currentQuestion.description, code: codeContent } });
    }
  }, [currentQuestion, codeContent]);

  const getSocraticDebug = useCallback((output: string) => {
    if (currentQuestion) {
      sendWsMessage({ type: 'GET_SOCRATIC_DEBUG', payload: { question: currentQuestion.description, code: codeContent, output } });
    }
  }, [currentQuestion, codeContent]);

  const getComplexityAnalysis = useCallback(() => {
    if (currentQuestion) {
      setComplexityResult({ status: 'loading' });
      sendWsMessage({ type: 'GET_COMPLEXITY_ANALYSIS', payload: { question: currentQuestion.description, code: codeContent } });
    }
  }, [currentQuestion, codeContent]);

  const getOptimizationChallenge = useCallback(() => {
    if (currentQuestion) {
      sendWsMessage({ type: 'GET_OPTIMIZATION_CHALLENGE', payload: { question: currentQuestion.description, code: codeContent } });
    }
  }, [currentQuestion, codeContent]);

  const startTimer = useCallback((durationMinutes: number = 45) => {
    sendWsMessage({ type: 'START_TIMER', payload: { durationMinutes } });
  }, []);

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

  const toggleScreenShare = useCallback(async () => {
    if (!rtcRef.current) return;
    
    if (isScreenSharing) {
      // Revert to camera
      if (originalVideoTrack.current && localStream) {
        const senders = rtcRef.current.getSenders();
        const sender = senders.find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(originalVideoTrack.current);
          localStream.removeTrack(localStream.getVideoTracks()[0]);
          localStream.addTrack(originalVideoTrack.current);
        }
        setIsScreenSharing(false);
      }
    } else {
      // Switch to screen share
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        
        if (localStream) {
          originalVideoTrack.current = localStream.getVideoTracks()[0];
          const senders = rtcRef.current.getSenders();
          const sender = senders.find(s => s.track?.kind === 'video');
          
          if (sender) {
            sender.replaceTrack(screenTrack);
            localStream.removeTrack(originalVideoTrack.current);
            localStream.addTrack(screenTrack);
          }
          
          setIsScreenSharing(true);
          
          screenTrack.onended = () => {
            // Revert when user stops sharing via browser native UI
            if (originalVideoTrack.current && localStream) {
              const sender = rtcRef.current?.getSenders().find(s => s.track?.kind === 'video');
              if (sender) sender.replaceTrack(originalVideoTrack.current);
              localStream.removeTrack(screenTrack);
              localStream.addTrack(originalVideoTrack.current);
              setIsScreenSharing(false);
            }
          };
        }
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
  }, [localStream, isScreenSharing]);

  return {
    status,
    localStream,
    remoteStream,
    roomId,
    chatMessages,
    codeContent,
    codeOutput,
    isCodeRunning,
    editorLanguage,
    role,
    currentQuestion,
    incomingWhiteboardPatch,
    incomingExcalidrawElements,
    incomingExcalidrawPointer,
    incomingWhiteboardCamera,
    aiHint,
    complexityResult,
    interviewEndTime,
    joinQueue,
    leaveQueue,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendCodeUpdate,
    sendWhiteboardSync,
    sendExcalidrawSync,
    sendExcalidrawPointerSync,
    sendWhiteboardCameraSync,
    sendAnalyzeWhiteboard,
    sendSaveSnapshots,
    setLanguage,
    reportFocusLoss,
    executeCode,
    getHint,
    getSocraticDebug,
    getComplexityAnalysis,
    getOptimizationChallenge,
    startTimer,
    selectQuestion,
    swapRoles,
    submitFeedback,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    connectionQuality,
  };
}
