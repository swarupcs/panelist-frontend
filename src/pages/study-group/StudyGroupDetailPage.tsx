import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGroupDetails, useGroupMessages, useSendMessage, useJoinGroup, useLeaveGroup } from '@/hooks/useStudyGroups';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Users, Send, Loader2, Globe, Lock, Crown, LogOut } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function StudyGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const { data: group, isLoading, error } = useGroupDetails(id!);
  const { data: messages } = useGroupMessages(id!);
  
  const sendMessage = useSendMessage();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const [messageInput, setMessageInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    sendMessage.mutate(
      { id: id!, content: messageInput },
      { onSuccess: () => setMessageInput('') }
    );
  };

  const handleJoin = (e?: React.FormEvent) => {
    e?.preventDefault();
    joinGroup.mutate({ id: id!, joinCode: group?.isPrivate ? joinCodeInput : undefined });
  };

  const handleLeave = () => {
    if (confirm('Are you sure you want to leave this group?')) {
      leaveGroup.mutate(id!, {
        onSuccess: () => navigate('/forum') // back to list
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">Loading group...</div>;
  }

  if (error || !group) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Group not found or Private</h2>
        <p className="text-muted-foreground mb-6">This group might not exist, or you don't have permission to view it.</p>
        <Link to="/forum" className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg">
          Back to Groups
        </Link>
      </div>
    );
  }

  // Not logged in or not a member -> Show preview & Join button
  if (!isAuthenticated || !group.isMember) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Link to="/forum" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="size-4" /> Back
        </Link>

        <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg">
          <div className="flex justify-center mb-4">
            {group.isPrivate ? <Lock className="size-12 text-amber-500" /> : <Globe className="size-12 text-emerald-500" />}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{group.name}</h1>
          <p className="text-muted-foreground mb-8">{group.description}</p>

          {!isAuthenticated ? (
            <Link to={`/login?redirect=/groups/${id}`} className="inline-flex px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity">
              Sign In to Join
            </Link>
          ) : (
            <form onSubmit={handleJoin} className="max-w-xs mx-auto space-y-4">
              {group.isPrivate && (
                <input
                  required
                  type="text"
                  placeholder="Enter join code"
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-center"
                />
              )}
              <button
                type="submit"
                disabled={joinGroup.isPending || (group.isPrivate && !joinCodeInput)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {joinGroup.isPending && <Loader2 className="size-4 animate-spin" />}
                Join Group
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 md:-m-6">
      {/* Header */}
      <header className="flex-none h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/forum" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              {group.name}
              {group.isPrivate && <Lock className="size-4 text-amber-500" />}
            </h1>
            <p className="text-xs text-muted-foreground">{group._count.members} Members</p>
          </div>
        </div>

        <button onClick={handleLeave} className="text-xs font-semibold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded flex items-center gap-2 transition-colors">
          <LogOut className="size-4" /> Leave
        </button>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {!messages ? (
              <div className="text-center py-10 text-muted-foreground">Loading chat...</div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No messages yet. Say hello!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.author.id === user?.id;
                const showHeader = idx === 0 || messages[idx - 1].author.id !== msg.author.id;

                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && showHeader && (
                      <div className="shrink-0">
                        {msg.author.profilePicture ? (
                          <img src={msg.author.profilePicture} alt="" className="size-8 rounded-full" />
                        ) : (
                          <div className="size-8 rounded-full bg-secondary text-foreground flex items-center justify-center text-xs font-bold">
                            {msg.author.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    )}
                    {!isMe && !showHeader && <div className="w-8 shrink-0" />}

                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showHeader && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground">{isMe ? 'You' : msg.author.name}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                        </div>
                      )}
                      <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary text-foreground rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-none p-4 bg-card/50 backdrop-blur-sm border-t border-border">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-background border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
              />
              <button
                type="submit"
                disabled={sendMessage.isPending || !messageInput.trim()}
                className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Members */}
        <div className="hidden lg:flex flex-col w-64 flex-none border-l border-border bg-card">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="size-4" /> Members
            </h3>
            {group.myRole === 'ADMIN' && group.joinCode && (
              <div className="mt-4 p-3 bg-secondary rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Join Code</p>
                <p className="text-sm font-mono font-bold text-foreground select-all">{group.joinCode}</p>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {group.members?.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="relative">
                  {member.user.profilePicture ? (
                    <img src={member.user.profilePicture} alt="" className="size-8 rounded-full" />
                  ) : (
                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {member.user.name.charAt(0)}
                    </div>
                  )}
                  {member.role === 'ADMIN' && (
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-card" title="Admin">
                      <Crown className="size-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
