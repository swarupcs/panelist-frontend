import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '@/hooks/useForum';
import { ForumCategories } from '@/api/forum';
import type { GetPostsOptions, ForumPost } from '@/api/forum';
import { MessageSquare, ThumbsUp, Eye, CheckCircle2, Search, Plus, Filter, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

const categories = [
  { id: undefined, label: 'All Discussions' },
  { id: ForumCategories.GENERAL, label: 'General' },
  { id: ForumCategories.DSA, label: 'DSA' },
  { id: ForumCategories.SYSTEM_DESIGN, label: 'System Design' },
  { id: ForumCategories.BEHAVIORAL, label: 'Behavioral' },
  { id: ForumCategories.INTERVIEW_EXPERIENCE, label: 'Interview Experience' },
  { id: ForumCategories.CAREER_ADVICE, label: 'Career Advice' },
];

const sortOptions = [
  { id: 'newest', label: 'Newest' },
  { id: 'top', label: 'Top Voted' },
  { id: 'unanswered', label: 'Unanswered' },
];

export default function ForumListPage() {
  const { isAuthenticated } = useAuthStore();
  const [options, setOptions] = useState<GetPostsOptions>({
    page: 1,
    limit: 15,
    sortBy: 'newest',
  });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = usePosts(options);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOptions({ ...options, search: searchInput, page: 1 });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="size-8 text-primary" />
            Community Forum
          </h1>
          <p className="text-muted-foreground mt-1">
            Discuss interview experiences, ask for advice, and help others.
          </p>
        </div>
        {isAuthenticated ? (
          <Link
            to="/forum/ask"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:opacity-90 transition-opacity"
          >
            <Plus className="size-5" /> Ask Question
          </Link>
        ) : (
          <Link
            to="/login?redirect=/forum"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-foreground font-semibold rounded-lg shadow hover:bg-secondary/80 transition-colors"
          >
            Sign in to Ask
          </Link>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 order-2 lg:order-1">
          {/* Mobile Filters */}
          <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((c) => (
              <button
                key={c.id || 'all'}
                onClick={() => setOptions({ ...options, category: c.id as any, page: 1 })}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  options.category === c.id
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-card border-border hover:border-primary/50 text-muted-foreground'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search & Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </form>
            <div className="flex bg-card border border-border rounded-lg p-1">
              {sortOptions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setOptions({ ...options, sortBy: s.id as any, page: 1 })}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    options.sortBy === s.id
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Post List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-20 text-muted-foreground">Loading posts...</div>
            ) : data?.posts.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border rounded-xl">
                <MessageSquare className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground">No discussions found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              data?.posts.map((post: ForumPost) => (
                <Link
                  key={post.id}
                  to={`/forum/${post.id}`}
                  className="block bg-card border border-border hover:border-primary/40 rounded-xl p-5 transition-all group"
                >
                  <div className="flex gap-4 sm:gap-6">
                    {/* Stats */}
                    <div className="hidden sm:flex flex-col items-end gap-2 text-xs text-muted-foreground min-w-[70px] shrink-0 pt-1">
                      <div className="flex items-center gap-1.5">
                        {post.upvotes - post.downvotes} <ThumbsUp className="size-3.5" />
                      </div>
                      <div className={`flex items-center gap-1.5 ${post.isResolved ? 'text-emerald-400 font-medium' : post.commentCount! > 0 ? 'text-primary' : ''}`}>
                        {post.commentCount} <MessageSquare className="size-3.5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {post.viewCount} <Eye className="size-3.5" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground uppercase tracking-wider">
                          {post.category.replace('_', ' ')}
                        </span>
                        {post.isResolved && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                            <CheckCircle2 className="size-3" /> RESOLVED
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-tight mb-2 truncate">
                        {post.title}
                      </h2>
                      
                      {/* Mobile Stats */}
                      <div className="flex sm:hidden items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="size-3" /> {post.upvotes - post.downvotes}
                        </span>
                        <span className={`flex items-center gap-1 ${post.isResolved ? 'text-emerald-400' : ''}`}>
                          <MessageSquare className="size-3" /> {post.commentCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="size-3" /> {post.viewCount}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 4).map((tag: string) => (
                          <span key={tag} className="text-xs text-muted-foreground bg-background border border-border px-2 py-0.5 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Author Line */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {post.author.profilePicture ? (
                            <img src={post.author.profilePicture} alt="" className="size-5 rounded-full" />
                          ) : (
                            <div className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                              {post.author.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-foreground/80">{post.author.name}</span>
                        </div>
                        <span>asked {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {data && data.pagination.totalPages > 1 && (
             <div className="mt-8 flex justify-center gap-2">
               <button 
                 onClick={() => setOptions({ ...options, page: Math.max(1, options.page! - 1) })}
                 disabled={options.page === 1}
                 className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary disabled:opacity-50"
               >
                 Previous
               </button>
               <span className="px-4 py-2 text-sm text-muted-foreground">
                 Page {options.page} of {data.pagination.totalPages}
               </span>
               <button 
                 onClick={() => setOptions({ ...options, page: Math.min(data.pagination.totalPages, options.page! + 1) })}
                 disabled={options.page === data.pagination.totalPages}
                 className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary disabled:opacity-50"
               >
                 Next
               </button>
             </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-64 shrink-0 order-1 lg:order-2">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Filter className="size-4" /> Categories
            </h3>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c.id || 'all'}>
                  <button
                    onClick={() => setOptions({ ...options, category: c.id as any, page: 1 })}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      options.category === c.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-border/50">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Google', 'System Design', 'React', 'Dynamic Programming', 'Amazon', 'Offer Negotiation'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setSearchInput(tag); setOptions({ ...options, search: tag, page: 1 }); }}
                    className="text-xs bg-secondary hover:bg-primary/20 hover:text-primary text-muted-foreground px-2.5 py-1 rounded-md transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
