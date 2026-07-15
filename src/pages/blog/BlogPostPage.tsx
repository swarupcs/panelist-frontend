// src/pages/blog/BlogPostPage.tsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Brain, ArrowLeft, ArrowRight, Clock, Tag,
  CalendarDays, Share2, ChevronRight,
  Code2, Network, Users, Monitor, Rocket, Server,
} from 'lucide-react';
import { getBlogPost, getRelatedPosts } from '@/data/blog-posts';

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

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = slug ? getBlogPost(slug) : undefined;
  const related = slug ? getRelatedPosts(slug, 3) : [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} — InterviewCoach.ai Blog`;
      // Update meta description
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', post.excerpt);

      // Add structured data (JSON-LD) for SEO
      let script = document.querySelector('#blog-jsonld') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'blog-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        author: { '@type': 'Organization', name: post.author.name },
        datePublished: post.publishedAt,
        publisher: {
          '@type': 'Organization',
          name: 'InterviewCoach.ai',
        },
        keywords: post.tags.join(', '),
      });

      return () => {
        const el = document.querySelector('#blog-jsonld');
        if (el) el.remove();
      };
    }
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Post Not Found</h1>
          <p className="text-muted-foreground">The article you're looking for doesn't exist.</p>
          <Link to="/blog" className="inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="size-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const Icon = iconMap[post.coverIcon] || Code2;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, text: post.excerpt, url }); }
      catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

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
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Blog
            </Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-foreground gradient-primary rounded-lg px-5 py-2.5 shadow-lg hover:opacity-90 transition-opacity">
              Get Started Free <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero cover */}
      <div className={`relative pt-16 bg-gradient-to-br ${post.coverGradient}`}>
        <div className="flex items-center justify-center py-16 sm:py-24">
          <Icon className="size-32 sm:size-40 text-white/15" />
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-background" style={{ borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
      </div>

      {/* Breadcrumb */}
      <div className="max-w-3xl mx-auto px-4 -mt-4 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="size-3" />
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground/70 truncate max-w-[200px]">{post.title}</span>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 pb-16">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryColors[post.category] || 'bg-primary/10 text-primary border-primary/20'}`}>
            {post.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" /> {post.readingTime} min read
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3" /> {formatDate(post.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-6">
          {post.title}
        </h1>

        {/* Author + Share */}
        <div className="flex items-center justify-between mb-10 pb-8 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white">
              {post.author.avatar}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{post.author.name}</div>
              <div className="text-xs text-muted-foreground">{post.author.role}</div>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
          >
            <Share2 className="size-3.5" /> Share
          </button>
        </div>

        {/* Content */}
        <div
          className="prose prose-invert prose-sm sm:prose-base max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-foreground/80 prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground
            prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-card prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl
            prose-pre:text-foreground/80
            prose-ul:text-foreground/80 prose-ol:text-foreground/80
            prose-li:marker:text-primary
            prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:text-foreground/70
            prose-table:text-sm
            prose-th:text-foreground prose-th:bg-secondary prose-th:px-4 prose-th:py-2
            prose-td:px-4 prose-td:py-2 prose-td:border-border/30 prose-td:text-foreground/70
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-border/40">
          {post.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs text-muted-foreground">
              <Tag className="size-3" /> {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Ready to Practice?</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Stop reading, start practicing. Our AI adapts to your level and gives instant feedback — just like a real interviewer.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground gradient-primary rounded-xl px-8 py-3 shadow-lg hover:opacity-90 transition-opacity"
          >
            Start Practicing Free <ArrowRight className="size-4" />
          </Link>
        </div>
      </article>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <h2 className="text-xl font-bold text-foreground mb-6">Related Articles</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {related.map((r) => {
              const RIcon = iconMap[r.coverIcon] || Code2;
              return (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="group rounded-xl border border-border/50 bg-card/60 overflow-hidden hover:border-primary/30 transition-all"
                >
                  <div className={`flex items-center justify-center p-6 bg-gradient-to-br ${r.coverGradient}`}>
                    <RIcon className="size-10 text-white/25" />
                  </div>
                  <div className="p-5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border mb-2 ${categoryColors[r.category] || ''}`}>
                      {r.category}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">{r.readingTime} min read</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

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
