// src/pages/blog/BlogListPage.tsx
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Brain, ArrowRight, Clock, Tag, CalendarDays,
  Code2, Network, Users, Monitor, Rocket, Server,
} from 'lucide-react';
import { blogPosts } from '@/data/blog-posts';

const iconMap: Record<string, React.ElementType> = {
  Code2, Network, Users, Monitor, Rocket, Server,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

const categoryColors: Record<string, string> = {
  DSA: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'System Design': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Behavioral: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Frontend: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Career: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Backend: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function BlogListPage() {
  useEffect(() => {
    document.title = 'Blog — AI Interview Coach | DSA, System Design & Interview Tips';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Expert guides on DSA, system design, behavioral interviews, and career growth. Free articles to help you ace your next tech interview.');
  }, []);

  const featured = blogPosts[0];
  const rest = blogPosts.slice(1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl gradient-primary shadow-lg">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              InterviewCoach<span className="text-primary">.ai</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-foreground gradient-primary rounded-lg px-5 py-2.5 shadow-lg hover:opacity-90 transition-opacity">
              Get Started Free <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="relative pt-28 pb-12 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/3 w-[400px] h-[400px] bg-primary/6 rounded-full blur-[120px]" />
          <div className="absolute top-32 right-1/3 w-[300px] h-[300px] bg-accent/6 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Interview Prep <span className="text-primary">Blog</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Expert guides, curated question lists, and actionable strategies to help you
            ace your next tech interview.
          </p>
        </div>
      </header>

      {/* Featured Post */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <Link
          to={`/blog/${featured.slug}`}
          className="group block rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-all duration-300"
        >
          <div className="grid md:grid-cols-2">
            {/* Cover */}
            <div className={`relative flex items-center justify-center p-12 bg-gradient-to-br ${featured.coverGradient}`}>
              {(() => {
                const Icon = iconMap[featured.coverIcon] || Code2;
                return <Icon className="size-24 text-white/30" />;
              })()}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                  Featured
                </span>
              </div>
            </div>
            {/* Content */}
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryColors[featured.category] || 'bg-primary/10 text-primary border-primary/20'}`}>
                  {featured.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" /> {featured.readingTime} min read
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
                {featured.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {featured.excerpt}
              </p>
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-white">
                  {featured.author.avatar}
                </div>
                <span className="text-xs text-muted-foreground">{featured.author.name}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" /> {formatDate(featured.publishedAt)}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Post Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => {
            const Icon = iconMap[post.coverIcon] || Code2;
            return (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden hover:border-primary/30 hover:bg-card/90 transition-all duration-300"
              >
                {/* Mini cover */}
                <div className={`relative flex items-center justify-center p-8 bg-gradient-to-br ${post.coverGradient}`}>
                  <Icon className="size-14 text-white/25" />
                </div>
                {/* Body */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${categoryColors[post.category] || 'bg-primary/10 text-primary border-primary/20'}`}>
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="size-2.5" /> {post.readingTime} min
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">
                    {post.excerpt}
                  </p>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground">
                        <Tag className="size-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                  {/* Footer */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="size-3" />
                    {formatDate(post.publishedAt)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg gradient-primary">
              <Brain className="size-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">InterviewCoach<span className="text-primary">.ai</span></span>
          </Link>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} InterviewCoach.ai — All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
