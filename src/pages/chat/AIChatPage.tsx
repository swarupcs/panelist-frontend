// src/pages/chat/AIChatPage.tsx
// Wires POST /api/query — the multi-agent AI interview coach conversation.
// Agents: DSA, System Design, Behavioral, Resume Review, Learning Support.
// Add route: <Route path="/chat" element={<AIChatPage />} /> in App.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Copy,
  CheckCheck,
  Brain,
} from 'lucide-react';
import { queryApi } from '@/api/interview.api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  getConfidenceColor,
  getConfidenceLabel,
  formatInterviewType,
} from '@/utils/formatters';
import { cn } from '@/lib/cn';

// ── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentType?: string;
  confidence?: number;
  suggestedFollowUps?: string[];
  timestamp: Date;
}

// ── Starters ───────────────────────────────────────────────────────────────

const STARTERS = [
  {
    label: 'DSA question',
    prompt: 'Give me a medium difficulty binary search problem to practice.',
  },
  {
    label: 'System design',
    prompt: 'Explain how you would design a URL shortener like bit.ly.',
  },
  {
    label: 'Behavioral tip',
    prompt: 'Can you ask me a leadership behavioral interview question?',
  },
  {
    label: 'Resume advice',
    prompt:
      'What are the most important sections for a software engineer resume?',
  },
  {
    label: 'Study plan',
    prompt: 'I struggle with dynamic programming. How should I study it?',
  },
  {
    label: 'Mock interview',
    prompt:
      'Start a short mock DSA interview — give me a question and evaluate my answer.',
  },
];

// ── Agent badge ────────────────────────────────────────────────────────────

function AgentBadge({
  type,
  confidence,
}: {
  type?: string;
  confidence?: number;
}) {
  if (!type) return null;
  const label = formatInterviewType(
    type.replace('_interview', '').replace('_', ' '),
  );
  return (
    <div className='flex items-center gap-2 mt-1'>
      <Badge variant='outline' className='text-xs'>
        {label} Agent
      </Badge>
      {confidence != null && (
        <span className={cn('text-xs', getConfidenceColor(confidence))}>
          {getConfidenceLabel(confidence)} confidence
        </span>
      )}
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────

function MessageBubble({
  message,
  onFollowUp,
}: {
  message: Message;
  onFollowUp: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isAssistant ? 'items-start' : 'items-start flex-row-reverse',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isAssistant ? 'bg-primary/10' : 'bg-secondary',
        )}
      >
        {isAssistant ? (
          <Bot className='size-4 text-primary' />
        ) : (
          <User className='size-4 text-muted-foreground' />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 space-y-2',
          !isAssistant && 'flex flex-col items-end',
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 max-w-[85%]',
            isAssistant
              ? 'rounded-tl-none bg-card border border-border'
              : 'rounded-tr-none bg-primary text-primary-foreground',
          )}
        >
          {isAssistant ? (
            <div className='prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1 prose-p:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded prose-pre:bg-secondary/50'>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <p className='text-sm leading-relaxed'>{message.content}</p>
          )}
        </div>

        {isAssistant && (
          <div className='flex flex-col gap-2 pl-1'>
            <div className='flex items-center gap-2'>
              <AgentBadge
                type={message.agentType}
                confidence={message.confidence}
              />
              <button
                type='button'
                onClick={handleCopy}
                className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
              >
                {copied ? (
                  <CheckCheck className='size-3 text-green-400' />
                ) : (
                  <Copy className='size-3' />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {message.suggestedFollowUps &&
              message.suggestedFollowUps.length > 0 && (
                <div className='flex flex-wrap gap-1.5'>
                  {message.suggestedFollowUps.map((suggestion) => (
                    <button
                      key={suggestion}
                      type='button'
                      onClick={() => onFollowUp(suggestion)}
                      className={cn(
                        'flex items-center gap-1 rounded-full border border-border bg-secondary/30 px-3 py-1',
                        'text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors',
                      )}
                    >
                      {suggestion}
                      <ChevronRight className='size-3' />
                    </button>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AIChatPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [useRAG, setUseRAG] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || !user) return;

      const userMsg: Message = {
        id: uuidv4(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const res = await queryApi.processQuery({
          query: text.trim(),
          userId: user.id,
          sessionId,
          useRAG,
        });

        const assistantMsg: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: res.response,
          agentType: res.agentType,
          confidence: res.confidence,
          suggestedFollowUps: res.suggestedFollowUps,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg: Message = {
          id: uuidv4(),
          role: 'assistant',
          content:
            "I'm sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [isLoading, user, sessionId, useRAG],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className='flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto'>
      {/* Header */}
      <div className='flex items-center justify-between pb-3 border-b border-border'>
        <div className='flex items-center gap-3'>
          <div className='flex size-9 items-center justify-center rounded-xl bg-primary/10'>
            <Brain className='size-5 text-primary' />
          </div>
          <div>
            <h1 className='text-base font-bold text-foreground'>
              AI Interview Coach
            </h1>
            <p className='text-xs text-muted-foreground'>
              Multi-agent system · DSA, System Design, Behavioral, Resume,
              Learning
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <label className='flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer'>
            <input
              type='checkbox'
              checked={useRAG}
              onChange={(e) => setUseRAG(e.target.checked)}
              className='rounded border-border accent-primary'
            />
            RAG
          </label>
          {messages.length > 0 && (
            <button
              type='button'
              onClick={clearChat}
              className='flex items-center gap-1 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
              title='Clear chat'
            >
              <RotateCcw className='size-4' />
            </button>
          )}
          <button
            type='button'
            onClick={() => navigate('/interview')}
            className='flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
          >
            <Sparkles className='size-3.5 text-primary' />
            Full Interview
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className='flex-1 overflow-y-auto py-4 space-y-4'>
        {messages.length === 0 && (
          <div className='space-y-6 animate-fade-in'>
            {/* Welcome */}
            <div className='text-center space-y-2 pt-4'>
              <div className='flex justify-center'>
                <div className='rounded-full bg-primary/10 p-4'>
                  <Brain className='size-8 text-primary' />
                </div>
              </div>
              <h2 className='text-lg font-bold text-foreground'>
                How can I help you today?
              </h2>
              <p className='text-sm text-muted-foreground max-w-sm mx-auto'>
                Ask me DSA questions, request mock interviews, get study advice,
                or discuss system design — I'll route to the right specialist
                automatically.
              </p>
            </div>

            {/* Starter prompts */}
            <div className='grid grid-cols-2 gap-2'>
              {STARTERS.map((s) => (
                <button
                  key={s.label}
                  type='button'
                  onClick={() => sendMessage(s.prompt)}
                  className={cn(
                    'flex flex-col gap-1 rounded-xl border border-border bg-card p-3 text-left',
                    'hover:border-primary/30 hover:bg-primary/5 transition-all duration-200',
                  )}
                >
                  <span className='text-xs font-semibold text-primary'>
                    {s.label}
                  </span>
                  <span className='text-xs text-muted-foreground line-clamp-2'>
                    {s.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onFollowUp={(text) => sendMessage(text)}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className='flex gap-3 items-start animate-fade-in'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10'>
              <Bot className='size-4 text-primary' />
            </div>
            <div className='rounded-2xl rounded-tl-none border border-border bg-card px-4 py-3'>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Loader2 className='size-3.5 animate-spin' />
                <span className='text-xs'>Thinking…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className='border-t border-border pt-3 pb-1'>
        <div className='flex gap-2 items-end'>
          <div className='relative flex-1'>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ask anything about interviews… (Enter to send, Shift+Enter for new line)'
              rows={1}
              disabled={isLoading}
              className={cn(
                'w-full resize-none rounded-xl border border-border bg-card px-4 py-3 pr-10',
                'text-sm text-foreground placeholder:text-muted-foreground/50',
                'focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50',
                'min-h-[44px] max-h-[140px] overflow-y-auto',
              )}
              style={{ fieldSizing: 'content' } as any}
            />
          </div>
          <Button
            variant='gradient'
            size='sm'
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className='shrink-0 size-11 p-0 rounded-xl'
          >
            {isLoading ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Send className='size-4' />
            )}
          </Button>
        </div>
        <p className='text-[10px] text-muted-foreground text-center mt-2'>
          Routed automatically to DSA · System Design · Behavioral · Resume ·
          Learning agents
        </p>
      </div>
    </div>
  );
}
