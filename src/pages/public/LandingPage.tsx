// src/pages/public/LandingPage.tsx
import { Link } from 'react-router-dom';
import {
  Brain, Mic, Code2, BarChart3, Target, Trophy,
  Sparkles, ArrowRight, CheckCircle2, Star,
  Zap, Shield, Users, Clock, ChevronRight,
  BookOpen, MessageSquare, TrendingUp,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ─── Intersection Observer hook for scroll animations ─────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ─── Animated counter ─────────────────────────────────────────────────────── */
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useInView();

  useEffect(() => {
    if (!isVisible) return;
    let current = 0;
    const step = Math.ceil(end / 40);
    const timer = setInterval(() => {
      current += step;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(current);
    }, 30);
    return () => clearInterval(timer);
  }, [isVisible, end]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Section wrapper with animation ───────────────────────────────────────── */
function Section({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const { ref, isVisible } = useInView();
  return (
    <section
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </section>
  );
}

/* ─── Features data ────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Brain,
    title: 'AI-Powered Interviews',
    description: 'Practice with intelligent AI agents specialized in DSA, System Design, Frontend, Backend, DevOps, and Behavioral interviews.',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Mic,
    title: 'Voice Mode',
    description: 'Simulate real interviews with voice-based Q&A powered by Web Speech API. Speak your answers naturally.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Code2,
    title: 'Live Code Execution',
    description: 'Write, run, and test your code against real test cases — just like a technical interview at a top company.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    description: 'Track your performance across categories, identify weak areas, and watch your improvement over time.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: Target,
    title: 'Company-Specific Prep',
    description: 'Practice questions actually asked at Google, Amazon, Meta, Microsoft, and 50+ other companies.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Trophy,
    title: 'Gamification & Streaks',
    description: 'Earn achievements, maintain streaks, climb leaderboards, and stay motivated throughout your prep.',
    gradient: 'from-yellow-500 to-orange-500',
  },
];

const howItWorks = [
  { step: '01', title: 'Choose Your Track', desc: 'Select interview type, difficulty, and target company.' },
  { step: '02', title: 'Practice with AI', desc: 'Answer questions, write code, and get real-time feedback.' },
  { step: '03', title: 'Review & Improve', desc: 'Analyze your performance and focus on weak areas.' },
  { step: '04', title: 'Ace the Interview', desc: 'Walk in confident with data-backed preparation.' },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'SDE-2 at Amazon',
    avatar: 'PS',
    text: 'The AI agents feel like real interviewers. The adaptive difficulty is incredible — it pushed me just enough to grow without being overwhelming.',
    stars: 5,
  },
  {
    name: 'Rahul Verma',
    role: 'Frontend Engineer at Google',
    avatar: 'RV',
    text: 'Voice mode was a game-changer for my behavioral prep. I practiced STAR stories until they became second nature. Got my dream offer!',
    stars: 5,
  },
  {
    name: 'Ananya Patel',
    role: 'SDE-1 at Microsoft',
    avatar: 'AP',
    text: 'The company-specific question bank is gold. 4 out of 5 questions in my actual Microsoft interview were variations of what I practiced here.',
    stars: 5,
  },
];

const stats = [
  { value: 10000, suffix: '+', label: 'Questions' },
  { value: 50, suffix: '+', label: 'Companies' },
  { value: 9, suffix: '', label: 'AI Agents' },
  { value: 95, suffix: '%', label: 'Satisfaction' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ─── Landing Page Component ───────────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Navbar ──────────────────────────────────────────────────────── */}
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

          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-foreground gradient-primary rounded-lg px-5 py-2.5 shadow-lg hover:opacity-90 transition-opacity"
            >
              Get Started Free <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <header className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
            style={{ animation: 'fadeIn 0.6s ease forwards' }}
          >
            <Sparkles className="size-4" />
            AI-Powered Interview Preparation
          </div>

          {/* Title */}
          <h1
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            style={{ animation: 'fadeIn 0.8s ease forwards' }}
          >
            Ace Your Next
            <br />
            <span className="bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(280,65%,70%)] to-[hsl(var(--accent))] bg-clip-text text-transparent">
              Tech Interview
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ animation: 'fadeIn 1s ease forwards' }}
          >
            Practice with 9 specialized AI agents. Get instant feedback on your code,
            system design, and behavioral answers. Prepare for Google, Amazon, Meta
            and 50+ top companies.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            style={{ animation: 'fadeIn 1.1s ease forwards' }}
          >
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 text-base font-semibold text-primary-foreground gradient-primary rounded-xl px-8 py-3.5 shadow-xl glow-primary hover:scale-[1.03] transition-all duration-200"
            >
              Start Practicing Free
              <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-base font-medium text-muted-foreground border border-border rounded-xl px-8 py-3.5 hover:text-foreground hover:border-muted-foreground/40 transition-all"
            >
              See Features
              <ChevronRight className="size-4" />
            </a>
          </div>

          {/* Hero visual — mock terminal */}
          <div
            className="relative max-w-3xl mx-auto"
            style={{ animation: 'fadeIn 1.3s ease forwards' }}
          >
            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-2xl overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-card/90">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-500/70" />
                  <div className="size-3 rounded-full bg-yellow-500/70" />
                  <div className="size-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs text-muted-foreground ml-2 font-mono">AI Interview Coach — Mock Session</span>
              </div>
              {/* Terminal content */}
              <div className="p-6 sm:p-8 text-left font-mono text-sm space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0">AI ▸</span>
                  <span className="text-foreground/90">Given an array of integers, find two numbers that add up to a target. What approach would you use?</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0">You ▸</span>
                  <span className="text-foreground/70">I'd use a hash map for O(n) time. Iterate once, storing complements...</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0">AI ▸</span>
                  <span className="text-foreground/90">Excellent! Your solution is optimal. <span className="text-green-400 font-semibold">Score: 9.2/10</span> — Let's try a follow-up with constraints...</span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-px flex-1 bg-border/40" />
                  <span className="text-xs text-muted-foreground">Live AI Feedback • Code Execution • Voice Mode</span>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
              </div>
            </div>
            {/* Floating glow behind terminal */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-b from-primary/10 to-accent/10 blur-2xl" />
          </div>
        </div>
      </header>

      {/* ─── Stats Bar ───────────────────────────────────────────────────── */}
      <Section className="py-12 border-y border-border/30 bg-card/30">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                <Counter end={s.value} suffix={s.suffix} />
              </div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <div id="features" className="py-24 px-4">
        <Section className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-4">
              <Zap className="size-3.5" /> Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need to <span className="text-primary">Crack the Interview</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From your first practice problem to your final offer letter — we've got every step covered.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Section key={f.title} delay={i * 80}>
                <div className="group relative h-full rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-7 hover:border-primary/30 hover:bg-card/90 transition-all duration-300">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center size-12 rounded-xl bg-gradient-to-br ${f.gradient} mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="size-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </Section>
            ))}
          </div>
        </Section>
      </div>

      {/* ─── How It Works ────────────────────────────────────────────────── */}
      <div id="how-it-works" className="py-24 px-4 bg-card/20 border-y border-border/20">
        <Section className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-accent mb-4">
              <BookOpen className="size-3.5" /> How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              From Zero to <span className="text-accent">Offer Letter</span> in 4 Steps
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <Section key={item.step} delay={i * 100}>
                <div className="relative text-center p-6">
                  <div className="text-5xl font-black bg-gradient-to-b from-primary/20 to-transparent bg-clip-text text-transparent mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                  {i < 3 && (
                    <ArrowRight className="hidden lg:block absolute top-14 -right-3 size-5 text-border" />
                  )}
                </div>
              </Section>
            ))}
          </div>
        </Section>
      </div>

      {/* ─── Testimonials ────────────────────────────────────────────────── */}
      <div id="testimonials" className="py-24 px-4">
        <Section className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-4">
              <MessageSquare className="size-3.5" /> Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Loved by Engineers at <span className="text-primary">Top Companies</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Section key={t.name} delay={i * 100}>
                <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-7 h-full flex flex-col hover:border-primary/20 transition-colors">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="size-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  {/* Quote */}
                  <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-6">"{t.text}"</p>
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </Section>
      </div>

      {/* ─── Pricing Preview ─────────────────────────────────────────────── */}
      <div id="pricing" className="py-24 px-4 bg-card/20 border-y border-border/20">
        <Section className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-accent mb-4">
              <TrendingUp className="size-3.5" /> Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Start Free. <span className="text-accent">Upgrade When Ready.</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Practice as much as you want with our free tier. Go premium for unlimited sessions and advanced features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <Section delay={0}>
              <div className="rounded-2xl border border-border/50 bg-card/60 p-8">
                <h3 className="text-lg font-semibold text-foreground mb-1">Free</h3>
                <div className="text-3xl font-bold text-foreground mb-1">$0 <span className="text-sm font-normal text-muted-foreground">/ month</span></div>
                <p className="text-sm text-muted-foreground mb-6">Perfect for getting started</p>
                <ul className="space-y-3 mb-8">
                  {[
                    '3 AI interviews / day',
                    '5 AI chat messages / day',
                    'Basic analytics',
                    'DSA question bank',
                    'Community support',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="block text-center text-sm font-semibold border border-border rounded-lg px-6 py-3 hover:bg-secondary transition-colors"
                >
                  Get Started Free
                </Link>
              </div>
            </Section>

            {/* Pro */}
            <Section delay={100}>
              <div className="relative rounded-2xl border-2 border-primary/40 bg-card/80 p-8 shadow-xl">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-xs font-bold text-primary-foreground uppercase tracking-wide">
                  Most Popular
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Pro</h3>
                <div className="text-3xl font-bold text-foreground mb-1">$19 <span className="text-sm font-normal text-muted-foreground">/ month</span></div>
                <p className="text-sm text-muted-foreground mb-6">For serious interview prep</p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Unlimited AI interviews',
                    'Unlimited AI chat',
                    'Voice mode interviews',
                    'Company-specific prep',
                    'Advanced analytics & insights',
                    'Learning path & roadmap',
                    'Priority support',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="size-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="block text-center text-sm font-semibold text-primary-foreground gradient-primary rounded-lg px-6 py-3 shadow-lg hover:opacity-90 transition-opacity"
                >
                  Start 7-Day Free Trial
                </Link>
              </div>
            </Section>
          </div>
        </Section>
      </div>

      {/* ─── Final CTA ───────────────────────────────────────────────────── */}
      <Section className="py-28 px-4">
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-3xl" />
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of engineers who practiced smarter, not harder — and walked into their interviews with confidence.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 text-base font-semibold text-primary-foreground gradient-primary rounded-xl px-10 py-4 shadow-xl glow-primary hover:scale-[1.03] transition-all duration-200"
          >
            Start Practicing Now — It's Free
            <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="size-4" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Clock className="size-4" /> Setup in 30 seconds</span>
            <span className="flex items-center gap-1.5"><Users className="size-4" /> 10k+ engineers</span>
          </div>
        </div>
      </Section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/30 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg gradient-primary">
              <Brain className="size-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              InterviewCoach<span className="text-primary">.ai</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} InterviewCoach.ai — All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
