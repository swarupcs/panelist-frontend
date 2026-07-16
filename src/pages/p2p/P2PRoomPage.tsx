import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebRTC } from '@/hooks/useWebRTC';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send, MessageSquare, RefreshCcw, FileText, Play, Bot, Loader2, Clock, CheckSquare, StopCircle, Disc, MonitorUp, MonitorOff, Plus, Trash2, Code2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { FeedbackModal } from '@/components/p2p/FeedbackModal';
import { WhiteboardTab } from '@/components/p2p/WhiteboardTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useScreenRecorder } from '@/hooks/useScreenRecorder';

function formatTimeLeft(ms: number) {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

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
    codeOutput,
    isCodeRunning,
    editorLanguage,
    role,
    currentQuestion,
    incomingWhiteboardPatch,
    aiHint,
    interviewEndTime,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendCodeUpdate,
    sendWhiteboardSync,
    setLanguage,
    executeCode,
    getHint,
    startTimer,
    selectQuestion,
    swapRoles,
    submitFeedback,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing
  } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [chatInput, setChatInput] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For Question Bank
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
  const [privateNotes, setPrivateNotes] = useState('');
  const [starChecklist, setStarChecklist] = useState({ S: false, T: false, A: false, R: false });
  const [testCases, setTestCases] = useState<Array<{ id: number, input: string, expected: string }>>([
    { id: 1, input: 'twoSum([2,7,11,15], 9)', expected: '[0,1]' }
  ]);

  const { isRecording, startRecording, stopRecording } = useScreenRecorder();

  useEffect(() => {
    if (interviewEndTime) {
      const interval = setInterval(() => {
        const remaining = interviewEndTime - Date.now();
        setTimeLeftMs(remaining > 0 ? remaining : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [interviewEndTime]);

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

  const handleEndCallClick = () => {
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = (tech: number, comm: number, fb: string) => {
    submitFeedback(tech, comm, fb);
    finishEndCall();
  };

  const finishEndCall = () => {
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

  const handleRunCode = () => {
    executeCode(codeContent, testCases);
  };

  const addTestCase = () => {
    setTestCases([...testCases, { id: Date.now(), input: '', expected: '' }]);
  };

  const updateTestCase = (id: number, field: 'input' | 'expected', value: string) => {
    setTestCases(testCases.map(tc => tc.id === id ? { ...tc, [field]: value } : tc));
  };

  const removeTestCase = (id: number) => {
    setTestCases(testCases.filter(tc => tc.id !== id));
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4 animate-fade-in bg-background">
      
      {/* LEFT PANEL: IDE & Chats */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <h2 className="font-bold">Interview Room</h2>
            {role && (
              <Badge variant={role === 'INTERVIEWER' ? 'default' : 'secondary'}>
                {role}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            {interviewEndTime ? (
              <div className={cn(
                "flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded-md",
                (timeLeftMs && timeLeftMs < 300000) ? "bg-red-500/20 text-red-500" : "bg-primary/10 text-primary"
              )}>
                <Clock className="h-5 w-5" />
                {timeLeftMs !== null ? formatTimeLeft(timeLeftMs) : '00:00'}
              </div>
            ) : (
              role === 'INTERVIEWER' && (
                <Button size="sm" variant="outline" onClick={() => startTimer(45)}>
                  <Clock className="h-4 w-4 mr-2" /> Start 45m Timer
                </Button>
              )
            )}
            
            {isRecording ? (
              <Button size="sm" variant="destructive" onClick={stopRecording} className="animate-pulse">
                <StopCircle className="h-4 w-4 mr-2" /> Stop Recording
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={startRecording}>
                <Disc className="h-4 w-4 mr-2" /> Record Session
              </Button>
            )}
          </div>
        </div>

        {currentQuestion && (
          <Card className="p-4 border-border bg-muted/50">
            <h3 className="font-bold text-lg mb-2">{currentQuestion.question}</h3>
            <p className="text-sm text-muted-foreground">{currentQuestion.description || "Implement the solution below."}</p>
          </Card>
        )}
        <Card className="flex-1 overflow-hidden flex flex-col border-border">
          <div className="bg-muted px-4 py-2 border-b text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Collaborative Workspace</span>
              <div className="flex items-center border rounded overflow-hidden">
                <div className="bg-background px-2 py-1 text-[10px] text-muted-foreground flex items-center border-r">
                  <Code2 className="h-3 w-3 mr-1" /> Lang
                </div>
                <select 
                  className="bg-background px-2 py-1 text-xs outline-none focus:ring-0 text-foreground w-28 cursor-pointer"
                  value={editorLanguage}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            </div>
            {status === 'connected' ? (
              <div className="flex items-center gap-4">
                <Button size="sm" variant="outline" onClick={handleRunCode} disabled={isCodeRunning} className="h-7 text-xs">
                  <Play className="h-3 w-3 mr-1" /> Run Code
                </Button>
                <span className="text-green-500 text-xs flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Connected
                </span>
              </div>
            ) : (
              <span className="text-yellow-500 text-xs">Waiting for peer...</span>
            )}
          </div>
          <div className="flex-1">
            <Tabs defaultValue="editor" className="h-full flex flex-col">
              <div className="px-4 py-2 border-b">
                <TabsList>
                  <TabsTrigger value="editor">Code Editor</TabsTrigger>
                  <TabsTrigger value="whiteboard">Whiteboard</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="editor" className="flex-1 mt-0 p-0 h-full">
                <Editor
                  height="100%"
                  language={editorLanguage}
                  theme="vs-dark"
                  value={codeContent}
                  onChange={handleEditorChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                  }}
                />
              </TabsContent>
              <TabsContent value="whiteboard" className="flex-1 mt-0 p-0 h-full border-t">
                <WhiteboardTab 
                  onSync={sendWhiteboardSync} 
                  incomingPatch={incomingWhiteboardPatch} 
                />
              </TabsContent>
            </Tabs>
          </div>
          {/* Terminal Output */}
          {codeOutput !== null && (
            <div className="h-48 border-t bg-black text-green-400 p-3 font-mono text-xs overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Terminal Output</span>
                <Button variant="ghost" size="sm" className="h-4 text-[10px] text-muted-foreground" onClick={() => executeCode('console.clear()')}>Clear</Button>
              </div>
              <pre className="whitespace-pre-wrap">{codeOutput}</pre>
            </div>
          )}
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
        
        {/* Actions for Interviewer */}
        {role === 'INTERVIEWER' && (
          <div className="flex flex-col gap-2">
            <Card className="p-3 border-border bg-primary/5 flex justify-between items-center">
              <Button size="sm" variant="outline" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <FileText className="h-4 w-4 mr-2" />
                Interviewer Tools
              </Button>
              <Button size="sm" variant="outline" onClick={swapRoles}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Swap Roles
              </Button>
            </Card>
            
            {isSidebarOpen && (
              <Card className="p-3 border-border flex flex-col gap-3">
                <Tabs defaultValue="bank">
                  <TabsList className="w-full grid grid-cols-4 mb-2">
                    <TabsTrigger value="bank" className="text-[10px] px-1">Bank</TabsTrigger>
                    <TabsTrigger value="tests" className="text-[10px] px-1">Tests</TabsTrigger>
                    <TabsTrigger value="star" className="text-[10px] px-1">STAR</TabsTrigger>
                    <TabsTrigger value="notes" className="text-[10px] px-1">Notes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="bank" className="space-y-2 mt-0 h-48 overflow-y-auto">
                    {[
                      { id: 1, type: 'Technical', question: "Two Sum", description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target." },
                      { id: 2, type: 'Technical', question: "Valid Palindrome", description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward." },
                      { id: 3, type: 'Behavioral', question: "Time you failed", description: "Tell me about a time you failed and what you learned." },
                      { id: 4, type: 'Behavioral', question: "Conflict with coworker", description: "Describe a situation where you had a conflict with a coworker and how you resolved it." },
                    ].map(q => (
                      <div key={q.id} className="p-2 border rounded-md cursor-pointer hover:bg-muted" onClick={() => selectQuestion(q)}>
                        <Badge variant={q.type === 'Technical' ? 'default' : 'secondary'} className="mb-1 text-[8px]">{q.type}</Badge>
                        <p className="text-xs font-medium">{q.question}</p>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="tests" className="space-y-2 mt-0 h-48 overflow-y-auto pr-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground font-semibold">Test Cases</span>
                      <Button size="sm" variant="ghost" className="h-5 px-2 text-[10px]" onClick={addTestCase}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {testCases.map((tc, index) => (
                      <div key={tc.id} className="p-2 border rounded bg-muted/30 relative space-y-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1 h-4 w-4 text-muted-foreground hover:text-red-500"
                          onClick={() => removeTestCase(tc.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div>
                          <span className="text-[10px] text-muted-foreground">Call (Input):</span>
                          <Input 
                            value={tc.input} 
                            onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)} 
                            placeholder="e.g. twoSum([2,7], 9)"
                            className="h-6 text-xs mt-1 bg-background"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground">Expected (JSON):</span>
                          <Input 
                            value={tc.expected} 
                            onChange={(e) => updateTestCase(tc.id, 'expected', e.target.value)} 
                            placeholder="e.g. [0,1]"
                            className="h-6 text-xs mt-1 bg-background"
                          />
                        </div>
                      </div>
                    ))}
                    {testCases.length === 0 && <p className="text-xs text-muted-foreground text-center mt-4">No test cases added.</p>}
                  </TabsContent>
                  
                  <TabsContent value="star" className="mt-0">
                    <div className="text-xs text-muted-foreground mb-2">Check off the S.T.A.R. components as the candidate answers behavioral questions.</div>
                    <div className="space-y-2">
                      {[
                        { key: 'S', label: 'Situation (Context)' },
                        { key: 'T', label: 'Task (Their responsibility)' },
                        { key: 'A', label: 'Action (What they did)' },
                        { key: 'R', label: 'Result (Impact/Outcome)' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={starChecklist[item.key as keyof typeof starChecklist]}
                            onChange={(e) => setStarChecklist({...starChecklist, [item.key]: e.target.checked})}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium">{item.key}: {item.label}</span>
                        </label>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="notes" className="mt-0 h-48">
                    <Textarea 
                      placeholder="Private notes (candidate cannot see these)..."
                      className="h-full resize-none text-xs"
                      value={privateNotes}
                      onChange={(e) => setPrivateNotes(e.target.value)}
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            )}

            <Card className="p-3 border-border bg-blue-500/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-blue-500 flex items-center">
                  <Bot className="h-3 w-3 mr-1" /> AI Co-Pilot
                </span>
                <Button size="sm" variant="secondary" className="h-6 text-[10px]" onClick={getHint} disabled={aiHint.status === 'loading' || !currentQuestion}>
                  {aiHint.status === 'loading' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : 'Get Hint'}
                </Button>
              </div>
              {aiHint.text && (
                <div className="text-xs text-muted-foreground p-2 bg-background rounded border">
                  {aiHint.text}
                </div>
              )}
            </Card>
          </div>
        )}

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
              variant="outline" 
              size="icon" 
              onClick={toggleScreenShare}
              className={cn("rounded-full h-12 w-12", isScreenSharing && "bg-blue-100 text-blue-600")}
            >
              {isScreenSharing ? <MonitorUp className="h-5 w-5" /> : <MonitorOff className="h-5 w-5" />}
            </Button>
            <Button 
              variant="destructive" 
              size="icon" 
              onClick={handleEndCallClick}
              className="rounded-full h-12 w-12"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </Card>

      </div>

      {/* Remove the old isolated sidebar */}
      
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={finishEndCall} 
        onSubmit={handleFeedbackSubmit} 
      />
    </div>
  );
}
