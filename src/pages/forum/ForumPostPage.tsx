import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePost, useVotePost, useVoteComment, useCreateComment, useAcceptAnswer } from '@/hooks/useForum';
import type { ForumComment } from '@/api/forum';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, MessageSquare, ThumbsUp, CheckCircle2, ChevronDown, ChevronUp, Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function VoteController({
  userVote = 0,
  upvotes,
  downvotes,
  onVote,
  horizontal = false
}: {
  userVote?: number;
  upvotes: number;
  downvotes: number;
  onVote: (val: 1 | -1) => void;
  horizontal?: boolean;
}) {
  const score = upvotes - downvotes;
  
  return (
    <div className={`flex ${horizontal ? 'flex-row items-center gap-3' : 'flex-col items-center gap-1'} text-muted-foreground`}>
      <button
        onClick={() => onVote(1)}
        className={`p-1.5 rounded-md hover:bg-secondary transition-colors ${userVote === 1 ? 'text-primary bg-primary/10' : ''}`}
      >
        <ChevronUp className="size-6" />
      </button>
      <span className={`font-bold text-lg ${userVote === 1 ? 'text-primary' : userVote === -1 ? 'text-red-500' : 'text-foreground'}`}>
        {score}
      </span>
      <button
        onClick={() => onVote(-1)}
        className={`p-1.5 rounded-md hover:bg-secondary transition-colors ${userVote === -1 ? 'text-red-500 bg-red-500/10' : ''}`}
      >
        <ChevronDown className="size-6" />
      </button>
    </div>
  );
}

function CommentItem({ 
  comment, 
  postId,
  postAuthorId,
  onReply
}: { 
  comment: ForumComment;
  postId: string;
  postAuthorId: string;
  onReply: (commentId: string, authorName: string) => void;
}) {
  const { user } = useAuthStore();
  const voteMutation = useVoteComment();
  const acceptMutation = useAcceptAnswer();

  const handleVote = (val: 1 | -1) => {
    if (!user) return; // could show toast here
    voteMutation.mutate({ postId, commentId: comment.id, value: val });
  };

  const handleAccept = () => {
    if (user?.id !== postAuthorId) return;
    acceptMutation.mutate({ postId, commentId: comment.id });
  };

  return (
    <div className="mt-6 flex gap-4">
      {/* Voter */}
      <div className="pt-2">
        <VoteController
          userVote={comment.userVote}
          upvotes={comment.upvotes}
          downvotes={comment.downvotes}
          onVote={handleVote}
        />
        {comment.isAcceptedAnswer && (
          <div className="mt-2 text-emerald-500 flex justify-center" title="Accepted Answer">
            <CheckCircle2 className="size-6" />
          </div>
        )}
        {!comment.isAcceptedAnswer && user?.id === postAuthorId && (
          <button
            onClick={handleAccept}
            className="mt-2 text-muted-foreground hover:text-emerald-500 flex justify-center w-full transition-colors"
            title="Mark as accepted answer"
          >
            <CheckCircle2 className="size-6 opacity-50 hover:opacity-100" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 border rounded-xl p-5 ${comment.isAcceptedAnswer ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-card border-border'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm">
            {comment.author.profilePicture ? (
              <img src={comment.author.profilePicture} alt="" className="size-6 rounded-full" />
            ) : (
              <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                {comment.author.name.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-foreground">{comment.author.name}</span>
            <span className="text-muted-foreground text-xs">
              • {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.authorId === postAuthorId && (
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold tracking-wider">AUTHOR</span>
            )}
          </div>
        </div>

        <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {comment.content}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => onReply(comment.id, comment.author.name)}
            className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            Reply
          </button>
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 border-l-2 border-border/50 pl-4 space-y-4">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="pt-2">
                <div className="flex items-center gap-2 text-xs mb-1.5">
                  <span className="font-semibold text-foreground">{reply.author.name}</span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {reply.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForumPostPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const { data: post, isLoading } = usePost(id!);
  const voteMutation = useVotePost();
  const commentMutation = useCreateComment();

  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string, name: string } | null>(null);

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">Loading post...</div>;
  }

  if (!post) {
    return <div className="text-center py-20">Post not found.</div>;
  }

  const handlePostVote = (val: 1 | -1) => {
    if (!user) return; // Add login prompt in real app
    voteMutation.mutate({ postId: post.id, value: val });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    commentMutation.mutate(
      { postId: post.id, content: commentContent, parentCommentId: replyTo?.id },
      {
        onSuccess: () => {
          setCommentContent('');
          setReplyTo(null);
        }
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <Link to="/forum" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="size-4" /> Back to Discussions
      </Link>

      <div className="flex flex-col md:flex-row gap-6 mb-12">
        {/* Post Voter */}
        <div className="hidden md:block">
          <VoteController
            userVote={post.userVote}
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            onVote={handlePostVote}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3 text-xs">
            <span className="px-2 py-1 rounded bg-secondary text-muted-foreground font-semibold uppercase tracking-wider">
              {post.category.replace('_', ' ')}
            </span>
            <span className="text-muted-foreground">
              Asked {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
            <span className="text-muted-foreground">
              Viewed {post.viewCount} times
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Mobile Voter */}
          <div className="md:hidden mb-6 border-b border-border/50 pb-4">
            <VoteController
              userVote={post.userVote}
              upvotes={post.upvotes}
              downvotes={post.downvotes}
              onVote={handlePostVote}
              horizontal
            />
          </div>

          {/* Post Body */}
          <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed bg-card border border-border rounded-xl p-6 sm:p-8">
            {post.content}
          </div>

          {/* Author info & Tags */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs bg-background border border-border text-muted-foreground px-2.5 py-1 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-3 flex items-center gap-3 min-w-[200px]">
              {post.author.profilePicture ? (
                <img src={post.author.profilePicture} alt="" className="size-8 rounded-full" />
              ) : (
                <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                  {post.author.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground">Asked by</div>
                <div className="text-sm font-semibold text-foreground">{post.author.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="border-t border-border pt-8">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          {post.comments?.length || 0} Answers
        </h2>

        {post.comments?.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={post.id}
            postAuthorId={post.authorId}
            onReply={(id, name) => setReplyTo({ id, name })}
          />
        ))}

        {/* Add Answer Form */}
        <div className="mt-12 bg-card border border-border rounded-xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-foreground mb-4">
            {replyTo ? `Replying to ${replyTo.name}` : 'Your Answer'}
          </h3>
          
          {replyTo && (
            <div className="mb-4 text-sm text-muted-foreground flex items-center justify-between bg-secondary p-3 rounded-lg">
              <span>You are writing a reply to a specific comment.</span>
              <button onClick={() => setReplyTo(null)} className="text-primary hover:underline">Cancel reply</button>
            </div>
          )}

          {!isAuthenticated ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You must be logged in to answer questions.</p>
              <Link to={`/login?redirect=/forum/${post.id}`} className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg">
                Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleAddComment}>
              <textarea
                required
                rows={6}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write your answer here..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y mb-4"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={commentMutation.isPending || !commentContent.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {commentMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Post Answer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
