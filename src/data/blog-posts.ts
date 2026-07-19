// src/data/blog-posts.ts
// Static blog content for SEO — replace with CMS/API later

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;            // markdown-ish HTML
  author: { name: string; avatar: string; role: string };
  category: string;
  tags: string[];
  publishedAt: string;        // ISO date
  readingTime: number;        // minutes
  coverGradient: string;      // tailwind gradient classes
  coverIcon: string;          // lucide icon name
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'top-50-dsa-questions-2026',
    title: 'Top 50 DSA Questions Every Developer Must Solve in 2026',
    excerpt: 'A curated list of the most frequently asked Data Structures & Algorithms questions at Google, Amazon, Meta, and Microsoft — with difficulty ratings and solution patterns.',
    category: 'DSA',
    tags: ['Arrays', 'Trees', 'Dynamic Programming', 'Graphs', 'Interview Prep'],
    publishedAt: '2026-05-25T10:00:00Z',
    readingTime: 12,
    coverGradient: 'from-cyan-500 to-blue-600',
    coverIcon: 'Code2',
    author: { name: 'InterviewCoach Team', avatar: 'IC', role: 'Engineering' },
    content: `
<p>Preparing for a technical interview in 2026? The landscape has shifted — companies now focus more on problem-solving patterns than memorizing solutions. Here are the 50 questions that appear most frequently across FAANG and top-tier startups.</p>

<h2>Arrays & Strings (10 Questions)</h2>
<p>Arrays remain the most tested topic. Master these patterns: <strong>Two Pointers</strong>, <strong>Sliding Window</strong>, and <strong>Hash Map lookups</strong>.</p>

<h3>1. Two Sum</h3>
<p><strong>Difficulty:</strong> Easy · <strong>Pattern:</strong> Hash Map</p>
<p>Given an array of integers and a target, return indices of two numbers that add up to the target. The brute force O(n²) approach iterates all pairs. The optimal solution uses a hash map for O(n) time — for each number, check if its complement exists in the map.</p>
<pre><code>function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}</code></pre>

<h3>2. Best Time to Buy and Sell Stock</h3>
<p><strong>Difficulty:</strong> Easy · <strong>Pattern:</strong> Kadane's variant</p>
<p>Track the minimum price seen so far and calculate profit at each step. This is essentially Kadane's algorithm applied to price differences.</p>

<h3>3. Container With Most Water</h3>
<p><strong>Difficulty:</strong> Medium · <strong>Pattern:</strong> Two Pointers</p>
<p>Start with the widest container (left and right pointers at edges). Move the pointer with the shorter height inward — you can only improve by finding a taller line.</p>

<h3>4. Longest Substring Without Repeating Characters</h3>
<p><strong>Difficulty:</strong> Medium · <strong>Pattern:</strong> Sliding Window</p>
<p>Maintain a window with a Set. Expand the right pointer; when a duplicate is found, shrink from the left until the window is valid again.</p>

<h3>5. Product of Array Except Self</h3>
<p><strong>Difficulty:</strong> Medium · <strong>Pattern:</strong> Prefix/Suffix</p>
<p>Build prefix products from left, then multiply with suffix products from right. No division needed, O(n) time.</p>

<h2>Trees & Graphs (10 Questions)</h2>
<p>Tree questions test your recursion skills. The key patterns: <strong>DFS (pre/in/post-order)</strong>, <strong>BFS (level-order)</strong>, and <strong>binary search tree properties</strong>.</p>

<h3>6. Maximum Depth of Binary Tree</h3>
<p><strong>Difficulty:</strong> Easy · <strong>Pattern:</strong> DFS</p>
<p>Classic recursion: <code>return root ? 1 + Math.max(maxDepth(root.left), maxDepth(root.right)) : 0</code></p>

<h3>7. Validate Binary Search Tree</h3>
<p><strong>Difficulty:</strong> Medium · <strong>Pattern:</strong> DFS with bounds</p>
<p>Pass min/max bounds down the recursion. Each node must be within (min, max). Left child gets (min, node.val), right gets (node.val, max).</p>

<h3>8. Number of Islands</h3>
<p><strong>Difficulty:</strong> Medium · <strong>Pattern:</strong> DFS/BFS flood fill</p>
<p>Iterate the grid. When you find a '1', increment the count and DFS/BFS to mark all connected '1's as visited.</p>

<h2>Dynamic Programming (10 Questions)</h2>
<p>DP is the most feared topic but follows clear patterns: <strong>1D DP</strong>, <strong>2D DP</strong>, <strong>knapsack variants</strong>, and <strong>interval DP</strong>.</p>

<h3>9. Climbing Stairs</h3>
<p><strong>Difficulty:</strong> Easy · <strong>Pattern:</strong> Fibonacci</p>
<p>dp[i] = dp[i-1] + dp[i-2]. You can reach step i from step i-1 or i-2.</p>

<h3>10. Longest Common Subsequence</h3>
<p><strong>Difficulty:</strong> Medium · <strong>Pattern:</strong> 2D DP</p>
<p>Classic 2D table. If characters match, dp[i][j] = dp[i-1][j-1] + 1. Otherwise, dp[i][j] = max(dp[i-1][j], dp[i][j-1]).</p>

<h2>Key Takeaways</h2>
<ul>
<li><strong>Pattern recognition > memorization.</strong> Learn the 15 core patterns and you can solve 90% of interview questions.</li>
<li><strong>Start with Easy, graduate to Medium.</strong> Don't jump to Hard problems before mastering the patterns.</li>
<li><strong>Time yourself.</strong> In a real interview, you have ~20 minutes per question. Practice under pressure.</li>
<li><strong>Explain your thinking.</strong> Interviewers care more about your approach than a perfect solution.</li>
</ul>

<p><strong>Ready to practice?</strong> Panelist adapts question difficulty to your level and gives instant feedback on your solutions — just like a real interviewer.</p>
`,
  },
  {
    slug: 'system-design-interview-guide',
    title: 'The Complete System Design Interview Guide for 2026',
    excerpt: 'Learn the framework top engineers use to ace system design interviews. Covers capacity estimation, API design, database choices, scaling strategies, and common pitfalls.',
    category: 'System Design',
    tags: ['Scalability', 'Distributed Systems', 'Architecture', 'Senior Engineer'],
    publishedAt: '2026-05-20T10:00:00Z',
    readingTime: 15,
    coverGradient: 'from-violet-500 to-purple-600',
    coverIcon: 'Network',
    author: { name: 'InterviewCoach Team', avatar: 'IC', role: 'Engineering' },
    content: `
<p>System design interviews are the gatekeepers for senior engineering roles. Unlike coding interviews, there's no single "correct" answer — interviewers evaluate your ability to think at scale, make trade-offs, and communicate complex ideas clearly.</p>

<h2>The Framework: RESHADED</h2>
<p>Use this 8-step framework to structure every system design answer:</p>
<ol>
<li><strong>R</strong>equirements — Clarify functional and non-functional requirements</li>
<li><strong>E</strong>stimation — Back-of-envelope capacity calculations</li>
<li><strong>S</strong>torage — Data model and database choices</li>
<li><strong>H</strong>igh-level design — Core components and their interactions</li>
<li><strong>A</strong>PI design — Endpoint signatures and contracts</li>
<li><strong>D</strong>etailed design — Deep dive into 2-3 critical components</li>
<li><strong>E</strong>rror handling — Failure modes and recovery strategies</li>
<li><strong>D</strong>eploy & scale — Horizontal scaling, caching, CDN, monitoring</li>
</ol>

<h2>Common Systems to Practice</h2>

<h3>URL Shortener (Easy)</h3>
<p>This is the "Hello World" of system design. Key concepts: Base62 encoding, hash collisions, read-heavy workload (100:1 read/write ratio), caching with Redis, and database partitioning by hash.</p>

<h3>Twitter/X Feed (Medium)</h3>
<p>The classic fan-out problem. Push model for normal users (pre-compute feeds), pull model for celebrities (fetch on demand), hybrid for the best of both worlds. Timeline stored in Redis sorted sets.</p>

<h3>Distributed Message Queue (Hard)</h3>
<p>Design Kafka from scratch. Topics, partitions, consumer groups, replication, exactly-once delivery. Key trade-offs: throughput vs latency, durability vs speed.</p>

<h2>Capacity Estimation Cheat Sheet</h2>
<ul>
<li>1 day = 86,400 seconds ≈ 100K seconds</li>
<li>1 million requests/day ≈ 12 requests/second</li>
<li>1 KB per record × 1 billion records = 1 TB</li>
<li>1 server handles ~10K concurrent connections</li>
<li>Redis: ~100K operations/second per node</li>
<li>SSD read latency: ~100 μs, Network round trip: ~500 μs</li>
</ul>

<h2>Database Selection Guide</h2>
<table>
<tr><th>Use Case</th><th>Database</th><th>Why</th></tr>
<tr><td>User profiles, transactions</td><td>PostgreSQL</td><td>ACID, relational integrity</td></tr>
<tr><td>Session data, caching</td><td>Redis</td><td>Sub-millisecond latency</td></tr>
<tr><td>Chat messages, IoT data</td><td>Cassandra</td><td>High write throughput</td></tr>
<tr><td>Product catalog, CMS</td><td>MongoDB</td><td>Flexible schema</td></tr>
<tr><td>Social graphs</td><td>Neo4j</td><td>Relationship queries</td></tr>
<tr><td>Search, full-text</td><td>Elasticsearch</td><td>Inverted index</td></tr>
</table>

<h2>Top Mistakes to Avoid</h2>
<ul>
<li><strong>Jumping to solutions</strong> — Spend 5 minutes on requirements first.</li>
<li><strong>Ignoring non-functional requirements</strong> — Latency, availability, and consistency matter more than features.</li>
<li><strong>Not doing math</strong> — Capacity estimation shows you can think at scale.</li>
<li><strong>Overcomplicating</strong> — Start simple, then iterate. "We can add X later" is a valid answer.</li>
</ul>

<p><strong>Practice system design with AI feedback</strong> — Our AI system design agent walks you through real interview scenarios and evaluates your architecture decisions in real-time.</p>
`,
  },
  {
    slug: 'behavioral-interview-star-method',
    title: 'Master Behavioral Interviews: The STAR Method with 20 Example Answers',
    excerpt: 'Behavioral interviews can make or break your offer. Learn the STAR framework and see 20 real example answers for the most common behavioral questions at top tech companies.',
    category: 'Behavioral',
    tags: ['STAR Method', 'Soft Skills', 'Leadership', 'Communication'],
    publishedAt: '2026-05-15T10:00:00Z',
    readingTime: 10,
    coverGradient: 'from-emerald-500 to-teal-600',
    coverIcon: 'Users',
    author: { name: 'InterviewCoach Team', avatar: 'IC', role: 'Engineering' },
    content: `
<p>At Amazon, behavioral questions carry equal weight to technical rounds. At Google, they determine your "Googleyness" score. At every company, they reveal whether you're someone people want to work with. Here's how to nail them.</p>

<h2>The STAR Framework</h2>
<p>Every behavioral answer should follow this structure:</p>
<ul>
<li><strong>S</strong>ituation — Set the scene. When was it? What was the context?</li>
<li><strong>T</strong>ask — What was your specific responsibility?</li>
<li><strong>A</strong>ction — What did YOU do? (Be specific, use "I" not "we")</li>
<li><strong>R</strong>esult — What happened? Quantify with metrics if possible.</li>
</ul>

<h2>The 5 Most Common Questions</h2>

<h3>1. "Tell me about a time you faced a conflict at work"</h3>
<p><strong>What they're testing:</strong> Conflict resolution, emotional intelligence, professional maturity.</p>
<p><strong>Example answer:</strong></p>
<blockquote>
<p><strong>S:</strong> On my last team, a senior engineer and I disagreed on whether to use GraphQL or REST for a new API. The decision was blocking sprint planning.</p>
<p><strong>T:</strong> As the tech lead for the project, I needed to resolve this quickly without damaging the working relationship.</p>
<p><strong>A:</strong> I organized a 30-minute technical review. I asked both of us to present our case with data — query patterns, team familiarity, client requirements. I also privately asked him what his core concern was, which turned out to be maintainability, not performance.</p>
<p><strong>R:</strong> We chose REST with a GraphQL gateway for specific high-query endpoints. Both approaches were validated. The project shipped on time, and he later told me it was the most productive technical discussion he'd had.</p>
</blockquote>

<h3>2. "Tell me about a time you failed"</h3>
<p><strong>What they're testing:</strong> Self-awareness, growth mindset, accountability.</p>
<p><strong>Key tip:</strong> Choose a real failure (not a humble brag). Focus 70% of your answer on what you learned and changed.</p>

<h3>3. "Describe a time you went above and beyond"</h3>
<p><strong>What they're testing:</strong> Initiative, ownership, passion.</p>
<p><strong>Key tip:</strong> Show impact with numbers. "I stayed late" is weak. "I built an automated pipeline that reduced deploy time from 2 hours to 15 minutes" is strong.</p>

<h3>4. "Tell me about a time you had to make a decision with incomplete information"</h3>
<p><strong>What they're testing:</strong> Decision-making under uncertainty, risk assessment.</p>
<p><strong>Key tip:</strong> Explain your reasoning framework. What signals did you prioritize? What was your fallback plan?</p>

<h3>5. "How do you handle tight deadlines?"</h3>
<p><strong>What they're testing:</strong> Prioritization, communication, stress management.</p>
<p><strong>Key tip:</strong> Show that you communicate proactively. "I identified the risk early and escalated to my manager with three options ranked by effort vs impact."</p>

<h2>Pro Tips</h2>
<ul>
<li><strong>Prepare 8-10 stories</strong> that cover different themes (conflict, failure, leadership, innovation, deadline, teamwork). Most questions map to these themes.</li>
<li><strong>Keep answers under 2 minutes.</strong> The interviewer should be asking follow-ups, not waiting for you to finish.</li>
<li><strong>Practice out loud.</strong> Behavioral answers that sound great in your head often fall apart when spoken. Use our voice mode to practice naturally.</li>
<li><strong>Be specific.</strong> Vague answers like "I'm a team player" score zero. Concrete stories score high.</li>
</ul>

<p><strong>Practice behavioral interviews with AI</strong> — Our behavioral agent asks follow-up questions just like a real interviewer and scores your STAR structure, specificity, and communication clarity.</p>
`,
  },
  {
    slug: 'react-interview-questions-2026',
    title: '30 React Interview Questions That Actually Get Asked in 2026',
    excerpt: 'Forget outdated class component questions. These are the React hooks, Server Components, and performance questions that companies are actually asking today.',
    category: 'Frontend',
    tags: ['React', 'JavaScript', 'Hooks', 'Server Components', 'Performance'],
    publishedAt: '2026-05-10T10:00:00Z',
    readingTime: 14,
    coverGradient: 'from-sky-500 to-indigo-600',
    coverIcon: 'Monitor',
    author: { name: 'InterviewCoach Team', avatar: 'IC', role: 'Engineering' },
    content: `
<p>React interviews in 2026 look very different from 2022. Class components are barely mentioned. Instead, interviewers focus on hooks, concurrent rendering, Server Components, and real-world performance optimization. Here are the questions you'll actually face.</p>

<h2>Hooks Deep Dive</h2>

<h3>1. What's the difference between useMemo and useCallback?</h3>
<p><code>useMemo</code> memoizes a <strong>computed value</strong>. <code>useCallback</code> memoizes a <strong>function reference</strong>. Both take a dependency array. Use <code>useMemo</code> for expensive computations, <code>useCallback</code> when passing callbacks to memoized children.</p>
<pre><code>// useMemo — cache expensive computation
const sorted = useMemo(() => items.sort(compareFn), [items]);

// useCallback — stable function reference
const handleClick = useCallback((id) => {
  dispatch({ type: 'SELECT', payload: id });
}, [dispatch]);</code></pre>

<h3>2. Explain the useEffect cleanup function</h3>
<p>The function returned from <code>useEffect</code> runs before the component unmounts AND before the effect re-runs (when deps change). Critical for: clearing timers, unsubscribing from events, cancelling fetch requests.</p>

<h3>3. Why can't you call hooks conditionally?</h3>
<p>React tracks hooks by their call order (index in a linked list). Conditional calls would shift indices between renders, causing hooks to return wrong values. This is enforced by the Rules of Hooks.</p>

<h2>Performance</h2>

<h3>4. How do you prevent unnecessary re-renders?</h3>
<ul>
<li><code>React.memo()</code> — skip re-render if props haven't changed</li>
<li><code>useMemo</code> / <code>useCallback</code> — stabilize values and references</li>
<li>State colocation — move state closer to where it's used</li>
<li>Lazy loading with <code>React.lazy()</code> and <code>Suspense</code></li>
<li>Virtualization for long lists (react-window, tanstack-virtual)</li>
</ul>

<h3>5. Explain React's reconciliation algorithm</h3>
<p>React diffs the virtual DOM tree using two heuristics: (1) elements of different types produce different trees, (2) the <code>key</code> prop identifies which children are stable across renders. This reduces O(n³) tree diff to O(n).</p>

<h2>Server Components (React 19+)</h2>

<h3>6. What are React Server Components?</h3>
<p>Components that render on the server and send HTML (not JavaScript) to the client. They can directly access databases, file systems, and APIs without exposing secrets. They cannot use hooks or browser APIs.</p>

<h3>7. When would you use "use client" vs default server components?</h3>
<p>Use <code>"use client"</code> only when you need: interactivity (onClick, onChange), hooks (useState, useEffect), or browser APIs (localStorage, navigator). Everything else should stay as a server component for smaller bundle size.</p>

<h2>State Management</h2>

<h3>8. Context vs Redux vs Zustand — when to use each?</h3>
<ul>
<li><strong>Context:</strong> Low-frequency updates (theme, locale, auth). Causes full subtree re-renders.</li>
<li><strong>Redux:</strong> Complex state with many reducers, middleware needs, time-travel debugging.</li>
<li><strong>Zustand:</strong> Simple global state with selector-based re-renders. Minimal boilerplate.</li>
</ul>

<h2>Key Advice</h2>
<p>Don't just know the API — understand <em>why</em> React works the way it does. Interviewers at top companies ask "why" more than "how". Understanding the virtual DOM, fiber architecture, and concurrent rendering will set you apart.</p>

<p><strong>Practice React questions with AI</strong> — Our frontend agent tests your knowledge of hooks, performance, and modern React patterns with follow-up questions that go deeper than surface-level answers.</p>
`,
  },
  {
    slug: 'how-to-prepare-for-faang-interview',
    title: 'The 90-Day FAANG Interview Preparation Roadmap',
    excerpt: 'A week-by-week study plan to go from zero to FAANG-ready in 90 days. Covers DSA, system design, behavioral prep, and mock interviews with specific daily targets.',
    category: 'Career',
    tags: ['FAANG', 'Study Plan', 'Roadmap', 'Career Growth'],
    publishedAt: '2026-05-05T10:00:00Z',
    readingTime: 8,
    coverGradient: 'from-amber-500 to-orange-600',
    coverIcon: 'Rocket',
    author: { name: 'InterviewCoach Team', avatar: 'IC', role: 'Engineering' },
    content: `
<p>Preparing for a FAANG interview feels overwhelming. There are thousands of LeetCode problems, hundreds of system design concepts, and endless behavioral questions. But with a structured 90-day plan, you can focus on what actually matters.</p>

<h2>Phase 1: Foundation (Weeks 1-4)</h2>
<h3>Goal: Master core data structures and algorithms</h3>
<p><strong>Daily target:</strong> 2-3 problems + 1 hour of concept study</p>
<ul>
<li>Week 1: Arrays, Strings, Hash Maps (Two Sum, Valid Anagram, Group Anagrams)</li>
<li>Week 2: Linked Lists, Stacks, Queues (Reverse LL, Valid Parentheses, Min Stack)</li>
<li>Week 3: Trees, BST, BFS/DFS (Max Depth, Validate BST, Level Order Traversal)</li>
<li>Week 4: Graphs, Topological Sort (Number of Islands, Course Schedule, Clone Graph)</li>
</ul>

<h2>Phase 2: Intermediate (Weeks 5-8)</h2>
<h3>Goal: Tackle medium-difficulty problems and start system design</h3>
<p><strong>Daily target:</strong> 2 medium problems + 1 system design concept</p>
<ul>
<li>Week 5: Dynamic Programming basics (Climbing Stairs, Coin Change, LCS)</li>
<li>Week 6: Advanced DP + Greedy (Word Break, House Robber, Jump Game)</li>
<li>Week 7: System Design — URL Shortener, Rate Limiter, Key-Value Store</li>
<li>Week 8: System Design — Twitter Feed, Chat System, Notification Service</li>
</ul>

<h2>Phase 3: Advanced (Weeks 9-11)</h2>
<h3>Goal: Hard problems, advanced system design, behavioral prep</h3>
<p><strong>Daily target:</strong> 1 hard problem + 1 mock interview</p>
<ul>
<li>Week 9: Hard DSA (Merge K Sorted Lists, Median of Two Sorted Arrays)</li>
<li>Week 10: Advanced System Design (Distributed Cache, Search Engine, Video Streaming)</li>
<li>Week 11: Behavioral prep — prepare 10 STAR stories covering leadership, conflict, failure, initiative</li>
</ul>

<h2>Phase 4: Mock & Polish (Week 12)</h2>
<h3>Goal: Simulate real interview conditions</h3>
<ul>
<li>Do 2 full mock interviews per day (1 coding + 1 system design/behavioral)</li>
<li>Review all weak areas identified from mock feedback</li>
<li>Practice explaining solutions out loud (use voice mode!)</li>
<li>Get 8 hours of sleep the night before your interview</li>
</ul>

<h2>Daily Schedule Template</h2>
<table>
<tr><th>Time</th><th>Activity</th><th>Duration</th></tr>
<tr><td>Morning</td><td>Solve 1-2 problems (focused, timed)</td><td>1.5 hours</td></tr>
<tr><td>Afternoon</td><td>Study concepts / system design</td><td>1 hour</td></tr>
<tr><td>Evening</td><td>Review solutions + spaced repetition</td><td>30 min</td></tr>
<tr><td>Weekend</td><td>Full mock interview + review</td><td>3 hours</td></tr>
</table>

<p><strong>Start your 90-day journey today</strong> — Our AI generates a personalized learning path based on your experience level, target company, and available time per day.</p>
`,
  },
  {
    slug: 'api-design-best-practices',
    title: 'REST API Design Best Practices: A Backend Engineer\'s Guide',
    excerpt: 'Learn how to design clean, scalable, and developer-friendly REST APIs. Covers naming conventions, versioning, pagination, error handling, and authentication patterns.',
    category: 'Backend',
    tags: ['REST API', 'Backend', 'Node.js', 'Architecture', 'Best Practices'],
    publishedAt: '2026-04-28T10:00:00Z',
    readingTime: 11,
    coverGradient: 'from-rose-500 to-pink-600',
    coverIcon: 'Server',
    author: { name: 'InterviewCoach Team', avatar: 'IC', role: 'Engineering' },
    content: `
<p>API design is one of the most common backend interview topics — and one of the most practical skills you'll use daily. A well-designed API is intuitive, consistent, and scales with your product. Here are the patterns that top companies follow.</p>

<h2>URL Naming Conventions</h2>
<ul>
<li>Use <strong>nouns</strong>, not verbs: <code>/users</code> not <code>/getUsers</code></li>
<li>Use <strong>plural</strong> forms: <code>/users</code> not <code>/user</code></li>
<li>Use <strong>kebab-case</strong>: <code>/user-profiles</code> not <code>/userProfiles</code></li>
<li>Nest for relationships: <code>/users/:id/orders</code></li>
<li>Use query params for filtering: <code>/users?role=admin&status=active</code></li>
</ul>

<h2>HTTP Methods</h2>
<table>
<tr><th>Method</th><th>Usage</th><th>Idempotent?</th></tr>
<tr><td>GET</td><td>Read resource(s)</td><td>Yes</td></tr>
<tr><td>POST</td><td>Create new resource</td><td>No</td></tr>
<tr><td>PUT</td><td>Full update (replace)</td><td>Yes</td></tr>
<tr><td>PATCH</td><td>Partial update</td><td>Yes</td></tr>
<tr><td>DELETE</td><td>Remove resource</td><td>Yes</td></tr>
</table>

<h2>Error Handling</h2>
<p>Always return consistent error objects:</p>
<pre><code>{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  }
}</code></pre>

<h2>Pagination</h2>
<p>For large datasets, use cursor-based pagination over offset-based:</p>
<pre><code>// Offset-based (simple but slow at scale)
GET /posts?page=5&limit=20

// Cursor-based (fast, consistent)
GET /posts?cursor=eyJpZCI6MTAwfQ&limit=20</code></pre>

<h2>Authentication Patterns</h2>
<ul>
<li><strong>JWT (stateless):</strong> Best for microservices. Each service verifies locally. Challenge: revocation requires a denylist.</li>
<li><strong>Session-based (stateful):</strong> Best for monoliths. Easy revocation. Challenge: requires shared session store for multiple servers.</li>
<li><strong>OAuth 2.0:</strong> For third-party integrations. Use PKCE flow for SPAs.</li>
</ul>

<h2>Versioning Strategies</h2>
<ul>
<li><strong>URL path:</strong> <code>/api/v1/users</code> — most common, explicit</li>
<li><strong>Header:</strong> <code>Accept: application/vnd.api+json;version=1</code> — cleaner URLs</li>
<li><strong>Query param:</strong> <code>/api/users?version=1</code> — easy to test</li>
</ul>

<p><strong>Practice API design interviews</strong> — Our backend agent challenges you to design real-world APIs and evaluates your naming conventions, error handling, and scalability decisions.</p>
`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const current = getBlogPost(currentSlug);
  if (!current) return blogPosts.slice(0, limit);
  return blogPosts
    .filter((p) => p.slug !== currentSlug)
    .sort((a, b) => {
      const aMatch = a.tags.filter((t) => current.tags.includes(t)).length;
      const bMatch = b.tags.filter((t) => current.tags.includes(t)).length;
      return bMatch - aMatch;
    })
    .slice(0, limit);
}
