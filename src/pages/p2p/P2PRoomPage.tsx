import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebRTC } from '@/hooks/useWebRTC';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

export default function P2PRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const {
    status,
    localStream,
    remoteStream,
    chatMessages,
    codeContent,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendCodeUpdate,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled
  } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }
    return () => leaveRoom();
  }, [roomId, joinRoom, leaveRoom]);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = () => {
    leaveRoom();
    navigate('/p2p');
    toast.info('Left the P2P session.');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      sendCodeUpdate(value);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4 animate-fade-in bg-background">
      
      {/* LEFT PANEL: IDE & Chats */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <Card className="flex-1 overflow-hidden flex flex-col border-border">
          <div className="bg-muted px-4 py-2 border-b text-sm font-medium flex items-center justify-between">
            <span>Collaborative Editor</span>
            {status === 'connected' ? (
              <span className="text-green-500 text-xs flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Connected
              </span>
            ) : (
              <span className="text-yellow-500 text-xs">Waiting for peer...</span>
            )}
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={codeContent}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
              }}
            />
          </div>
        </Card>

        {/* Chat Panel */}
        <Card className="h-64 flex flex-col border-border">
          <div className="bg-muted px-4 py-2 border-b text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Chat
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm mt-10">
                No messages yet. Say hi!
              </div>
            ) : (
              chatMessages.map(msg => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "items-start")}>
                    <div className={cn(
                      "px-3 py-1.5 rounded-lg text-sm",
                      isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-3 border-t">
            <form onSubmit={handleSendChat} className="flex gap-2">
              <Input 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                placeholder="Type a message..." 
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* RIGHT PANEL: Video Feeds & Controls */}
      <div className="w-80 flex flex-col gap-4 shrink-0">
        
        {/* Remote Video */}
        <Card className="bg-black border-border overflow-hidden relative aspect-video flex-shrink-0">
          {remoteStream ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              {status === 'searching' || status === 'matched' ? 'Connecting to peer...' : 'Peer disconnected'}
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            Peer
          </div>
        </Card>

        {/* Local Video */}
        <Card className="bg-black border-border overflow-hidden relative aspect-video flex-shrink-0">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted // Always mute local video playback to prevent echo
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            You
          </div>
        </Card>

        {/* Controls */}
        <Card className="p-4 border-border">
          <div className="flex justify-center gap-4">
            <Button 
              variant={isAudioEnabled ? "outline" : "destructive"} 
              size="icon" 
              onClick={toggleAudio}
              className="rounded-full h-12 w-12"
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button 
              variant={isVideoEnabled ? "outline" : "destructive"} 
              size="icon" 
              onClick={toggleVideo}
              className="rounded-full h-12 w-12"
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            <Button 
              variant="destructive" 
              size="icon" 
              onClick={handleEndCall}
              className="rounded-full h-12 w-12"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </Card>

      </div>

    </div>
  );
}
