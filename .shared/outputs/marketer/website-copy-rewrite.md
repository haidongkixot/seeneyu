# seeneyu — Website Copy Audit & Rewrite Proposal
> Owner: Marketer | Created: 2026-03-25 | Version: 1.0
> File audited: `src/app/page.tsx`

---

## Overall Assessment

The current landing page is **well-structured and visually polished** (dark theme, amber accents, animated hero). The major gaps are in **conversion copy** — the page needs stronger hooks, social proof specificity, and a clearer value proposition for different visitor intents.

**Score: 7/10** — Good foundation. Needs copy sharpening, not a redesign.

---

## Section-by-Section Audit

### 1. Hero Section

**Current:**
> Learn to command any room.
> From Hollywood's greatest performances — one scene at a time.
> CTA: "Start Learning — It's Free"

**Proposed:**
> Master body language. Command any room.
> Watch Hollywood's best performers. Record yourself. Get instant AI coaching — specific to the second.
> CTA: "Start Practicing Free" | Secondary: "See How It Works ↓"

**Rationale:**
- "Master body language" immediately tells the visitor what the product does (current headline is aspirational but vague)
- "specific to the second" differentiates from generic AI tools
- "Start Practicing Free" is more active than "Start Learning" — emphasizes the doing, not the consuming
- Secondary CTA should anchor-scroll to "How It Works" section (currently both links go to /library)

---

### 2. Our Mission Section

**Current:**
> Transforming how the world communicates.
> seeneyu uses AI and cinematic storytelling to help you master the non-verbal language of confident people.

**Proposed:**
> Body language is a skill. Now there's a way to practice it.
> seeneyu is the first AI coaching platform that turns Hollywood performances into your personal training library. Watch. Record. Get feedback. Repeat until it's second nature.

**Rationale:**
- "Transforming how the world communicates" is generic — could be any comms startup
- Lead with the insight ("it's a skill") then the product ("first AI coaching platform")
- Include the core loop in the mission — it's the entire differentiator

---

### 3. How It Works

**Current:**
> 01 Watch — Study how Hollywood actors command attention in curated scenes.
> 02 Mimic — Record yourself attempting the same body language behavior.
> 03 Improve — Get AI coaching with a score and specific, actionable tips.

**Proposed:**
> 01 Watch — Study how actors like Denzel Washington command a room. 65+ curated scenes.
> 02 Record — Turn on your webcam. Mimic what you just watched. 10 seconds is enough.
> 03 Get AI Feedback — Scored across 5 dimensions. "Your gaze held for 1.8s — aim for 2.5."

**Rationale:**
- Drop a specific actor name (aspirational, cinematic)
- "65+ curated scenes" adds proof of depth
- "10 seconds is enough" reduces the perceived commitment
- Show an example AI feedback line — makes the product tangible
- Rename "Mimic" to "Record" (more clear) and "Improve" to "Get AI Feedback" (more specific)

---

### 4. Skills Grid

**Current:**
> 5 skills that change how people see you.
> Each skill has beginner, intermediate, and advanced clips — start anywhere.

**Proposed:**
> 5 skills. 65+ scenes. From beginner to advanced.
> Each skill builds on real Hollywood performances. Start wherever you feel the gap.

**Rationale:**
- "change how people see you" is good but can feel like a claim — "from beginner to advanced" is factual and inviting
- "feel the gap" is more emotionally resonant than "start anywhere"

---

### 5. Team Section

**Current:**
> The People / Our Team
> Hai Hoang — Founder & CEO
> AI Lead — Head of AI
> Product Lead — Head of Product

**Proposed:**
- Replace generic "AI Lead" and "Product Lead" with real names/bios if available
- If the team is AI-augmented (as it is), consider reframing:

> Built by Hai Hoang + an AI-native development team.
> seeneyu was designed, engineered, and tested by a team of specialized AI agents orchestrated by a solo founder — proving that the future of product development is already here.

**Rationale:**
- A solo founder with an AI-augmented team is a compelling narrative for VCs and tech-savvy users
- Current placeholders ("AI Lead", "Product Lead") feel incomplete

---

### 6. Testimonials

**Current:**
> Sarah Chen, UX Designer — "After just 2 weeks..."
> Marcus Williams, Sales Manager — "The AI feedback is surprisingly spot-on..."
> Priya Patel, PhD Student — "I used to avoid eye contact..."

**Proposed:** Keep the quotes (they're strong), but add specificity:
- Add a metric to at least one testimonial: "My confidence score went from 42 to 78 in 3 weeks"
- Add company logos or industry labels if possible (even generic: "Tech Company", "Fortune 500")
- Consider adding a video testimonial CTA: "Want to share your story?"

**Note:** If these are sample users from the seed data (sarah.chen@example.com etc.), flag that real testimonials should be collected before public launch.

---

### 7. CTA Banner

**Current:**
> Ready to transform how you communicate?
> 65+ curated scenes. 5 essential skills. Unlimited practice.
> CTA: "Start Learning — It's Free" | "Browse Library →"

**Proposed:**
> Your body language practice starts now.
> 65+ scenes. 5 skills. AI feedback in seconds. No credit card required.
> CTA: "Start Practicing Free" | "Browse the Library →"

**Rationale:**
- "No credit card required" removes friction — standard SaaS best practice
- "AI feedback in seconds" is the hook that differentiates from passive content
- More active, less abstract

---

## SEO Keywords to Add

Add these to page metadata (`<title>`, `<meta description>`, heading tags):

| Keyword | Search Volume (est.) | Difficulty |
|---|---|---|
| body language training | Medium | Low |
| body language practice app | Low (new category) | Very Low |
| AI communication coaching | Medium | Medium |
| how to improve body language | High | Medium |
| body language for professionals | Medium | Low |
| virtual presentation skills | Medium | Medium |
| eye contact practice | Low | Very Low |
| confident body language | Medium | Low |

**Suggested meta description:**
> seeneyu — the AI body language coaching platform. Watch Hollywood performances, record yourself, and get instant AI feedback on eye contact, posture, vocal pacing, and more. Start free.

---

## Additional Recommendations

1. **Add pricing section** — visitors who scroll to the bottom are high intent. Show Basic/Standard/Advanced tiers before the final CTA.
2. **Add a "Try it now" embedded demo** — even a GIF/video showing the Watch → Record → Feedback loop in 15 seconds.
3. **Add press/social proof bar** — "Built with GPT-4o Vision" or "Powered by MediaPipe" tech badges add credibility.
4. **Mobile CTA stickiness** — add a sticky bottom CTA on mobile that stays visible during scroll.
5. **Analytics** — add event tracking on CTA clicks (which CTA, scroll depth at click time).

---

## Implementation Note

This is a **copy proposal only**. Changes to `src/app/page.tsx` should be implemented by the Backend Engineer or Designer after PM approval. Signal PM and Designer when ready for review.
