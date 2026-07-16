import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreatePost } from '@/hooks/useForum';
import type { ForumCategory } from '@/api/forum';
import { ForumCategories } from '@/api/forum';
import { ArrowLeft, Loader2, Info } from 'lucide-react';

const categories = [
  { id: ForumCategories.GENERAL, label: 'General' },
  { id: ForumCategories.DSA, label: 'DSA' },
  { id: ForumCategories.SYSTEM_DESIGN, label: 'System Design' },
  { id: ForumCategories.BEHAVIORAL, label: 'Behavioral' },
  { id: ForumCategories.INTERVIEW_EXPERIENCE, label: 'Interview Experience' },
  { id: ForumCategories.CAREER_ADVICE, label: 'Career Advice' },
];

export default function CreatePostPage() {
  const navigate = useNavigate();
  const createPost = useCreatePost();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ForumCategory>(ForumCategories.GENERAL);
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    createPost.mutate(
      { title, content, category, tags },
      {
        onSuccess: (post) => {
          navigate(`/forum/${post.id}`);
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Link to="/forum" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="size-4" /> Back to Discussions
      </Link>

      <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8">
        <Info className="size-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-primary">Writing a Good Question</h3>
          <p className="text-sm text-primary/80 mt-1">
            Be specific and concise. Include any relevant context, constraints, or previous approaches you've tried.
            Markdown is supported for formatting your code blocks and text.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-foreground">Ask a Question</h1>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How to optimize this graph traversal algorithm?"
            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ForumCategory)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. graphs, dsa, amazon"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Details (Markdown supported)</label>
          </div>
          <textarea
            required
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Explain your problem, paste your code, or share your experience..."
            className="w-full px-4 py-3 bg-background border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Link
            to="/forum"
            className="px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createPost.isPending || !title.trim() || !content.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {createPost.isPending && <Loader2 className="size-4 animate-spin" />}
            Post Question
          </button>
        </div>
      </form>
    </div>
  );
}
