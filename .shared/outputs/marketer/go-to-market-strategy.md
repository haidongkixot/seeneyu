# seeneyu — Go-to-Market Strategy
> Version 1.0 | Updated: 2026-03-29

---

## Strategic Overview

seeneyu's GTM follows a four-phase approach: product-led growth first, then content marketing for authority, then B2B enterprise sales, then platform licensing. Each phase builds on the previous one's traction.

**Timeline:** Phase 1 starts immediately. Phases overlap — they are additive, not sequential.

---

## Phase 1: Product-Led Growth (Month 1-6)

### Strategy
Let the product sell itself. Free tier + embeddable mini-games create viral loops. Users experience value before paying.

### Tactics

**1.1 Free Tier Funnel**
- Basic plan is genuinely useful: 5 clips, 5s recordings, text feedback, 5 Coach Ney messages/day
- No credit card required. Email signup with instant access after admin approval
- Upgrade prompts at natural friction points: longer recordings, full AI feedback, voice coaching

**1.2 Mini-Games as Viral Acquisition**
- 5 mini-games (Guess Expression, Match Expression, Expression King, Emotion Timeline, Spot the Signal) are embeddable via iframe on any website
- Anonymous play with no signup required — reduces friction to zero
- Certificate generated on completion with seeneyu branding and "Practice more at seeneyu.vercel.app" CTA
- Leaderboard creates competitive sharing: "I scored 94 on Expression King — beat me"
- Target placements: corporate team-building sites, HR blogs, psychology blogs, ESL platforms

**1.3 Product Hunt Launch**
- Launch with founder story: "We built the Duolingo for body language"
- Demo video showing the full loop: Watch clip -> Record yourself -> Get AI feedback
- First-day goal: 500 upvotes, top 5 Product of the Day
- Offer 3-month free Standard tier to first 500 signups from Product Hunt

**1.4 Referral Program**
- "Invite a friend, both get 1 week of Standard free"
- Social sharing on badge unlocks, streak milestones, leaderboard achievements
- Shareable practice comparison videos (side-by-side: clip vs. user recording)

### Key Metrics (Phase 1)
| Metric | Target |
|---|---|
| Signups | 5,000 |
| DAU/MAU ratio | 25%+ |
| Free-to-paid conversion | 5% |
| Mini-game plays (embedded) | 50,000 |

---

## Phase 2: Content Marketing (Month 3-12)

### Strategy
Establish seeneyu as the authority on body language training. Create content that ranks, shares, and drives organic signups.

### Tactics

**2.1 Blog (SEO)**
- CMS-powered blog at /blog
- Target keywords: "body language practice," "improve body language for interviews," "communication coaching app," "AI body language coach," "how to improve eye contact"
- Content pillars:
  - Skill deep-dives: "The Complete Guide to Eye Contact in Professional Settings"
  - Science-backed: "What Research Says About Body Language and Career Success"
  - How-to: "5 Body Language Exercises You Can Do Before Your Next Presentation"
  - Case studies: "How Sarah Improved Her Interview Presence in 14 Days"
- Publishing cadence: 2 posts/week
- Each post links to relevant free clips on seeneyu

**2.2 YouTube Channel**
- Short-form (60s): "Watch how Denzel commands a room — here's exactly what he does" with analysis overlay
- Medium-form (5-10 min): "3 Body Language Mistakes in Your Zoom Calls (and How to Fix Them)"
- Long-form (15-20 min): "I Practiced Body Language with AI for 30 Days — Here's What Happened"
- Every video ends with: "Practice this skill for free at seeneyu.vercel.app"
- Target: 100K subscribers in 12 months

**2.3 TikTok / Instagram Reels**
- 15-30s clips analyzing celebrity body language at events, interviews, debates
- "Body language breakdown" series — trending format
- Before/after user transformations (with permission)
- Coach Ney personality clips: AI coach reacting to common mistakes
- Target: 500K followers across platforms in 12 months

**2.4 LinkedIn Thought Leadership**
- Founder posts on communication skills, AI in education, soft skills gap
- Target audience: L&D professionals, HR leaders, executive coaches
- Cross-post blog content adapted for LinkedIn format
- Engage in comments on relevant industry posts
- Goal: build pipeline for Phase 3 B2B outreach

**2.5 Partnerships with Influencers**
- Communication coaches with YouTube/Instagram followings (10K-500K)
- Offer affiliate revenue: 30% of first 3 months from referred signups
- Provide custom embed codes for mini-games on their sites
- Send advance access to new features for review content

### Key Metrics (Phase 2)
| Metric | Target |
|---|---|
| Organic traffic (monthly) | 50,000 visitors |
| Blog posts published | 100 |
| YouTube subscribers | 100,000 |
| Social media followers (total) | 500,000 |
| Signups from content | 10,000 |

---

## Phase 3: B2B Enterprise Sales (Month 6-18)

### Strategy
Corporate L&D teams spend billions on soft skills training with no measurable ROI. seeneyu provides practice + measurement. Target mid-market first (500-5,000 employees), then enterprise.

### Tactics

**3.1 Enterprise Product Features**
- Team dashboards: manager sees team skill scores, practice frequency, improvement trends
- Custom content: upload company-specific scenarios (client meetings, sales pitches, all-hands presentations)
- SSO integration (SAML/OIDC)
- Analytics export for L&D reporting
- Admin controls: assign learning paths by role, department, or skill gap

**3.2 Pilot Program**
- Free 30-day pilot for qualifying companies (100+ employees)
- Dedicated onboarding: upload 10 custom scenarios, configure team structure
- Weekly progress reports to L&D decision-maker
- Success metric: measurable improvement in team communication scores over 30 days
- Convert 40% of pilots to paid annual contracts

**3.3 Target Industries (Priority Order)**
1. **Technology companies** — remote-heavy, video-call culture, progressive L&D budgets
2. **Consulting firms** — client-facing communication is core competency
3. **Financial services** — high-stakes presentations, client trust, compliance training
4. **Healthcare** — patient communication, bedside manner training
5. **Sales organizations** — pitch delivery, client rapport, negotiation body language

**3.4 Pricing (B2B)**
| Tier | Price | Includes |
|---|---|---|
| Team (up to 50 users) | $8/user/month (annual) | Full platform, team dashboard, 5 custom scenarios |
| Business (up to 500 users) | $6/user/month (annual) | Everything + SSO, unlimited custom scenarios, analytics export |
| Enterprise (500+ users) | Custom pricing | Everything + dedicated CSM, API access, LMS integration |

**3.5 Sales Channels**
- Outbound: LinkedIn Sales Navigator targeting L&D Directors, VP People, HR Heads
- Inbound: Case studies + ROI calculator on website
- Channel: Partner with executive coaching firms (BetterUp affiliates, independent coaches)
- Events: Speaking at HR Tech, ATD Conference, SHRM Annual

### Key Metrics (Phase 3)
| Metric | Target |
|---|---|
| Enterprise pilots | 20 |
| Paid enterprise accounts | 8 |
| B2B ARR | $500K |
| Average contract value | $60K/year |

---

## Phase 4: Platform / API Licensing (Month 12-24)

### Strategy
License the Learning Assistant Engine as SaaS to other edtech platforms, coaching services, and corporate training providers. seeneyu becomes infrastructure, not just application.

### Tactics

**4.1 Learning Assistant Engine as a Service**
- Abstracted engine with ILearner, IContentProvider, and INotificationChannel interfaces
- 3 analyzers (progress, engagement, skill-gap) + 3 planners (activity, reminder, motivation)
- 4 notification channels (in-app, push, email, WhatsApp)
- Any edtech platform can plug in their content and learner data to get intelligent coaching automation
- API-first: REST endpoints with webhook callbacks

**4.2 Target Customers for Engine**
- Language learning apps wanting to add engagement intelligence
- Corporate LMS platforms wanting AI-driven learner nudging
- Fitness/wellness apps wanting behavior coaching loops
- Tutoring platforms wanting automated study planning

**4.3 Pricing (API/SaaS)**
| Tier | Price | Includes |
|---|---|---|
| Starter | $500/month | Up to 1,000 learners, 2 channels, basic analyzers |
| Growth | $2,000/month | Up to 10,000 learners, all channels, all analyzers |
| Enterprise | Custom | Unlimited learners, custom analyzers, SLA, dedicated support |

**4.4 Mini-Game Licensing**
- White-label mini-games for corporate training platforms
- Expression King + Spot the Signal as standalone assessment tools
- Per-deployment licensing: $1,000/month per game per client

### Key Metrics (Phase 4)
| Metric | Target |
|---|---|
| API customers | 5 |
| Platform ARR | $200K |
| Mini-game licensing deals | 3 |

---

## Pricing Strategy Rationale

### Consumer Pricing ($0 / $12 / $24)

**Why free tier exists:**
- Body language coaching is a new category — users need to experience it before believing in it
- Mini-games and 5 free clips demonstrate the core value proposition
- Free-to-paid conversion is the primary growth engine in Phase 1

**Why $12/month for Standard:**
- Positioned below Duolingo Super ($14.99/month) — familiar price point for learning apps
- Covers AI API costs per user (GPT-4o for Coach Ney, TTS/STT)
- Low enough for impulse subscription; high enough to signal value
- Annual discount ($99/year = $8.25/month) drives commitment

**Why $24/month for Advanced:**
- 2x Standard creates clear value ladder
- 3-minute recordings + monthly coach summary justify premium
- Target: power users, serious professionals, executive aspirants
- Annual discount ($199/year = $16.58/month)

**Why not higher:**
- Category is new — price sensitivity is high until proven value
- BetterUp at $300+/month proves willingness to pay for coaching
- seeneyu's AI delivery model should command a fraction of human coaching cost
- Raise prices after establishing product-market fit and proof of outcomes

### B2B Pricing ($6-8/user/month)
- Below LinkedIn Learning ($30/user/month) and Coursera for Business ($399/user/year)
- ROI story: "Measurable improvement in team communication for less than one in-person workshop"
- Per-seat model aligns with enterprise procurement expectations
- Annual contracts ensure revenue predictability

---

## Key Partnerships to Pursue

### Tier 1 — Strategic (Month 1-6)
| Partner Type | Example | Value to seeneyu | Value to Partner |
|---|---|---|---|
| Communication coaches (YouTube) | Vanessa Van Edwards, Vinh Giang, Alex Lyon | Distribution to engaged audience (100K-1M followers) | Affiliate revenue, exclusive content, embedded mini-games |
| Career platforms | LinkedIn, Glassdoor, Indeed | Integration touchpoint for interview prep | Unique body language coaching feature for premium users |
| Presentation tools | Canva, Pitch, Beautiful.ai | Pre-presentation practice integration | "Practice your delivery" feature powered by seeneyu |

### Tier 2 — Growth (Month 6-12)
| Partner Type | Example | Value to seeneyu | Value to Partner |
|---|---|---|---|
| Corporate LMS | Cornerstone, SAP SuccessFactors, Docebo | Enterprise distribution channel | Active practice module for soft skills (their biggest gap) |
| Executive coaching firms | BetterUp affiliates, Torch, Bravely | Between-session practice tool for their clients | Measurable improvement data between coaching sessions |
| Universities | Business schools, communication departments | Student user acquisition, credibility | AI practice tool for public speaking / leadership courses |

### Tier 3 — Platform (Month 12-24)
| Partner Type | Example | Value to seeneyu | Value to Partner |
|---|---|---|---|
| Edtech platforms | Duolingo, Babbel, Coursera | Engine licensing revenue | Intelligent learning assistant without building from scratch |
| HR tech | Workday, BambooHR, Rippling | Embedded coaching in HRIS | Soft skills training integrated in existing workflow |
| Assessment platforms | SHL, HireVue, Pymetrics | Body language assessment data | Non-verbal communication scoring for candidate evaluation |

---

## Budget Allocation (First 12 Months, Assuming $1.5M Seed)

| Category | Budget | Key Spend |
|---|---|---|
| Product & Engineering | $675K (45%) | 3 hires: senior full-stack, ML engineer, mobile developer |
| Content & AI Data | $300K (20%) | Video content creation, AI training data, influencer content |
| Marketing & Acquisition | $300K (20%) | Product Hunt, social ads, SEO tools, influencer partnerships, events |
| Operations | $225K (15%) | Infrastructure (Vercel, Neon, OpenAI), legal, accounting, office |

---

## 12-Month Revenue Projection

| Quarter | Consumer ARR | B2B ARR | Total ARR | Key Driver |
|---|---|---|---|---|
| Q1 | $15K | $0 | $15K | Product Hunt launch, organic signups |
| Q2 | $60K | $0 | $60K | Content marketing ramp, influencer partnerships |
| Q3 | $150K | $50K | $200K | SEO traction, first enterprise pilots convert |
| Q4 | $300K | $200K | $500K | B2B pipeline matures, mobile app launch |

**Break-even target:** Month 18 at $80K MRR ($960K ARR run rate).
