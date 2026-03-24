/**
 * seeneyu — Sample Data Seed
 *
 * Creates 6 realistic learner profiles with:
 *   - SkillBaseline entries (onboarding assessment results)
 *   - UserSession records with full AI FeedbackResult JSON
 *   - MicroSession records (step-by-step practice attempts)
 *
 * Safe to re-run — skips users that already exist by email.
 *
 * Run: npx tsx scripts/seed-sample-data.ts
 * Or:  npm run db:sample
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// Types (local mirror — avoids src/ import issues in scripts)
// ─────────────────────────────────────────────────────────────
type SkillCategory =
  | "eye-contact"
  | "open-posture"
  | "active-listening"
  | "vocal-pacing"
  | "confident-disagreement";

type SkillLevel = "beginner" | "intermediate" | "advanced";

interface FeedbackDimension { label: string; score: number }
interface ActionPlanStep    { number: number; action: string; why: string }
interface FeedbackTip       { title: string; body: string }

interface FeedbackResult {
  overallScore: number;
  summary: string;
  dimensions: FeedbackDimension[];
  positives: string[];
  improvements: string[];
  steps: ActionPlanStep[];
  tips: FeedbackTip[];
  nextClipId?: string;
  modelUsed: string;
  processingMs: number;
}

interface MicroFeedback {
  verdict: "pass" | "needs-work";
  headline: string;
  detail: string;
}

// ─────────────────────────────────────────────────────────────
// Feedback factory helpers (skill-specific realistic AI output)
// ─────────────────────────────────────────────────────────────

function eyeContactFeedback(score: number, attempt: number): FeedbackResult {
  const improving = score >= 65;
  return {
    overallScore: score,
    summary: improving
      ? `Your eye contact is showing real improvement. The ${attempt > 2 ? "consistency" : "duration"} of your holds is building — you're maintaining gaze for 3–4 seconds before breaking naturally, which is exactly the target range for this clip.`
      : `You're developing your eye contact awareness. Your gaze tends to drop toward the end of sentences — a very common habit. The key is keeping the hold through the end of your point, not just the beginning.`,
    dimensions: [
      { label: "Eye Contact Duration",        score: Math.round(score / 10 + (improving ? 1 : -1)) },
      { label: "Natural Breaks (not nervous)", score: Math.round(score / 10 + (attempt > 1 ? 0.5 : -0.5)) },
      { label: "Warmth in Expression",        score: Math.round(score / 10 - 0.5) },
      { label: "Consistency Under Pressure",  score: Math.round(score / 10 - 1) },
    ],
    positives: improving
      ? ["Held gaze for 3+ seconds on two key points", "Side-break felt intentional, not anxious", "Micro-smile reached the eyes during pitch"]
      : ["Made initial eye contact confidently", "Recovered gaze after one break", "Expression stayed warm throughout"],
    improvements: improving
      ? ["Hold through the silence — you broke gaze just before the interviewer responded", "The final point needs a longer hold to land properly"]
      : ["Gaze drops at sentence ends — practice holding through the period", "Side-breaks go down instead of sideways — retrain to horizontal"],
    steps: [
      { number: 1, action: "Practice the 4-second hold drill — camera gaze, count silently, hold through the count", why: "Builds the muscle memory for sustained contact without flinching" },
      { number: 2, action: "Record yourself making a key point, then freeze the frame at the end — check where your eyes are", why: "Most people break gaze at the exact moment impact should land" },
      { number: 3, action: "Do one full pass of the clip script maintaining only side-breaks (never down)", why: "Down-breaks read as shame or uncertainty; lateral breaks read as thinking" },
    ],
    tips: [
      { title: "The 2–3 second rule", body: "Hold for 2–3 seconds before breaking. Less feels shifty; more feels aggressive. Count it until it's automatic." },
      { title: "Warmth activates from the eyes", body: "A smile that stays only in your mouth reads as performed. Let the expression reach your eyes — the crow's-feet area is what people actually read." },
    ],
    nextClipId: score >= 70 ? "clip_002" : undefined,
    modelUsed: "gpt-4o",
    processingMs: 2800 + Math.round(Math.random() * 1400),
  };
}

function openPostureFeedback(score: number, attempt: number): FeedbackResult {
  const improving = score >= 65;
  return {
    overallScore: score,
    summary: improving
      ? `Strong posture work this session. Your stance width is approaching target — feet are approaching shoulder-width, and the chest is staying open. The main opportunity is your hands: they still drift toward each other when you pause.`
      : `Your posture instinct is to protect — you closed slightly when challenged. That's the natural response, and it's exactly what this practice targets. The work is building a new default.`,
    dimensions: [
      { label: "Stance Width",    score: Math.round(score / 10 + (improving ? 0.5 : -1)) },
      { label: "Chest Openness",  score: Math.round(score / 10 + (attempt > 2 ? 0.5 : -0.5)) },
      { label: "Arm Position",    score: Math.round(score / 10 - 0.5) },
      { label: "Stillness",       score: Math.round(score / 10 - 1) },
      { label: "Gesture Quality", score: Math.round(score / 10 + (improving ? 1 : 0)) },
    ],
    positives: improving
      ? ["Shoulders stayed back for the full 60 seconds", "No arm-crossing even when pausing", "Chin held steady — didn't drop on hard points"]
      : ["Opened chest visibly at the start", "Caught one arm-cross and reversed it", "Feet wider than your normal default"],
    improvements: improving
      ? ["Hands drift together when not gesturing — practice the 'arms at sides' default", "One moment of forward-hunch as you leaned in for emphasis"]
      : ["Arms crossed when you were challenged — body said 'defend' before you could stop it", "Weight shifted to one leg repeatedly — distributing evenly is the target"],
    steps: [
      { number: 1, action: "Stand in full open posture for 60 seconds before every recording — prime the default", why: "Entering with the posture set means less cognitive load during the actual performance" },
      { number: 2, action: "Record from the side — check if your back is straight or rounding forward", why: "Front-view misses the forward-hunch. Side-view shows it clearly." },
      { number: 3, action: "Put your arms deliberately at your sides and hold for 10 seconds — it will feel exposed. Good.", why: "The exposed feeling IS open posture. That discomfort is the thing to habituate." },
    ],
    tips: [
      { title: "Stillness is a multiplier", body: "The more still your body is between gestures, the more powerful each gesture becomes. Constant movement is noise." },
      { title: "The pre-frame trick", body: "Set your posture before you speak. Once you're talking, cognitive load prevents conscious posture management. Set it first." },
    ],
    nextClipId: score >= 70 ? "clip_005" : undefined,
    modelUsed: "gpt-4o",
    processingMs: 3100 + Math.round(Math.random() * 1200),
  };
}

function activeListeningFeedback(score: number, attempt: number): FeedbackResult {
  const improving = score >= 65;
  return {
    overallScore: score,
    summary: improving
      ? `Your listening body language is becoming more calibrated. The forward lean timing is improving — you're moving toward the speaker at emotional beats rather than continuously, which is the more advanced technique.`
      : `Your face is going neutral when you're listening — a very common habit that reads as disinterest to the speaker. The work is letting your expression reflect the emotional weight of what's being said without over-acting it.`,
    dimensions: [
      { label: "Forward Lean",         score: Math.round(score / 10 + (improving ? 0.5 : -0.5)) },
      { label: "Nod Calibration",      score: Math.round(score / 10 - (attempt < 3 ? 1 : 0)) },
      { label: "Expression Mirroring", score: Math.round(score / 10 - 0.5) },
      { label: "Silence Tolerance",    score: Math.round(score / 10 - 1) },
    ],
    positives: improving
      ? ["Lean forward was timed to emotional beats, not continuous", "Face tracked the emotional weight of the scene", "Silence held for 3+ seconds before responding impulse"]
      : ["Maintained eye contact throughout the listening period", "Nodded at least once — intentionally", "Didn't interrupt or fill silences immediately"],
    improvements: improving
      ? ["Nod is still slightly automatic — three nods in quick succession at one point", "Face reset to neutral between beats — keep some baseline emotional presence"]
      : ["Expression went neutral for long stretches — speaker reads this as disengagement", "Nods are too frequent and too fast — one slow nod carries more weight than five quick ones"],
    steps: [
      { number: 1, action: "Practice the deliberate single nod: chin drops, pauses 1 second, rises once. Repeat 10 times deliberately.", why: "The single slow nod signals genuine processing; rapid multiple nods signal automatic agreement" },
      { number: 2, action: "Watch the clip again with your hand over the subtitles — focus only on the listener's face", why: "Isolating the listening face makes the technique visible in a way the full scene doesn't" },
      { number: 3, action: "Hold a silence for 5 full seconds after someone finishes speaking — count it", why: "Most people can only tolerate 2–3 seconds. Building to 5 rewires the filler instinct" },
    ],
    tips: [
      { title: "Your face is broadcasting", body: "Every expression (or lack of one) sends a signal. Neutral reads as bored. Present reads as engaged. The skill is the calibrated middle." },
      { title: "The lean-in signal", body: "Moving physically closer as the speaker becomes more vulnerable signals: I'm here for this. Timing it to the moment — not beforehand — is what makes it feel genuine." },
    ],
    nextClipId: score >= 70 ? "clip_008" : undefined,
    modelUsed: "gpt-4o",
    processingMs: 2600 + Math.round(Math.random() * 1600),
  };
}

function vocalPacingFeedback(score: number, attempt: number): FeedbackResult {
  const improving = score >= 65;
  return {
    overallScore: score,
    summary: improving
      ? `Your vocal pacing is developing a real architecture. The pauses are landing — especially before the key phrases. The main growth edge is trusting the silence: you're cutting pauses 30–40% shorter than the model. Let them breathe.`
      : `You're speaking at a consistent pace, which is a solid foundation. The next step is introducing deliberate variation — slow for importance, quiet for intimacy, pauses for impact. Right now the delivery is flat; the pitch changes will unlock a lot.`,
    dimensions: [
      { label: "Pause Usage",       score: Math.round(score / 10 - (improving ? 0 : 1.5)) },
      { label: "Tempo Variation",   score: Math.round(score / 10 - (attempt < 3 ? 1 : 0)) },
      { label: "Volume Control",    score: Math.round(score / 10 - 0.5) },
      { label: "Emphasis Technique", score: Math.round(score / 10 + (improving ? 0.5 : -1)) },
    ],
    positives: improving
      ? ["Clear pause before 'Carpe' — 1.5 seconds, well-placed", "Volume dropped noticeably on the intimate line", "Pace variation between the setup and the conclusion"]
      : ["Consistent delivery — no rushing or fading", "Volume stayed audible throughout", "Enunciation was clear on key words"],
    improvements: improving
      ? ["Pauses are being cut short — extend by another full second", "The whisper-drop could go quieter — you're at 60% of the target volume contrast"]
      : ["No pause variation — all sentences delivered at the same rhythm", "Volume stayed flat — the quiet drop on the key line is the whole technique", "'Carpe diem' delivered at normal pace — it needs a full stop before it"],
    steps: [
      { number: 1, action: "Record yourself saying just the final line — 'Carpe diem. Seize the day.' — with a 2-second pause before 'Carpe'. Record 5 versions.", why: "Isolating the peak moment lets you perfect the technique without managing the whole speech" },
      { number: 2, action: "Deliver the opening paragraph at half your normal speed. Don't speed up. Time it.", why: "Physically feeling the slow tempo builds the muscle memory for restraint under pressure" },
      { number: 3, action: "Drop to near-whisper on the 'poetry, beauty, romance, love' line. Record it. Listen to whether it forces you to lean in.", why: "If you can hear yourself clearly on the recording at low volume, you went quiet enough. If not, go quieter." },
    ],
    tips: [
      { title: "The pause feels longer to you", body: "A 2-second pause feels like 5 to the speaker. To the listener it's perfect. Trust the data: your pauses need to be longer than comfortable." },
      { title: "Silence is not dead air", body: "Silence is pressure. Before a key word it builds anticipation. After a key word it lets it land. Every pause is doing something." },
    ],
    nextClipId: score >= 70 ? "clip_011" : undefined,
    modelUsed: "gpt-4o",
    processingMs: 3400 + Math.round(Math.random() * 1000),
  };
}

function confidentDisagreementFeedback(score: number, attempt: number): FeedbackResult {
  const improving = score >= 65;
  return {
    overallScore: score,
    summary: improving
      ? `Your disagreement delivery is gaining confidence. The framing is clean — you're leading with your position rather than apologies. The next layer is vocal firmness: the end of your sentences is dropping in conviction before the period.`
      : `Your disagreement reads as tentative — the body language softens before you've finished the sentence, which tells the room the position isn't fully held. The verbal content is right; the delivery needs to match the conviction.`,
    dimensions: [
      { label: "Posture Stability",       score: Math.round(score / 10 - (improving ? 0 : 1)) },
      { label: "Vocal Firmness",          score: Math.round(score / 10 - 0.5) },
      { label: "Non-apologetic Framing",  score: Math.round(score / 10 + (attempt > 2 ? 0.5 : -1)) },
      { label: "Eye Contact Through End", score: Math.round(score / 10 - (improving ? 0 : 1.5)) },
      { label: "Pacing Under Pressure",   score: Math.round(score / 10 - 0.5) },
    ],
    positives: improving
      ? ["Opened with an assertion — no hedge, no apology", "Posture stayed open through the full delivery", "Eye contact held through the key counter-point"]
      : ["Started strong — first sentence confident", "Didn't raise your voice (confidence, not aggression)", "Made the counter-point clearly — content was right"],
    improvements: improving
      ? ["Voice dips on the final clause — the conviction needs to carry through the period", "One moment of looking away just before your conclusion landed"]
      : ["Body softened mid-disagreement — slight hunch and arms drifted inward", "Added 'I might be wrong but' before your point — remove the hedge entirely", "Eye contact broke before the sentence finished — that's where the conviction needs to be held"],
    steps: [
      { number: 1, action: "Deliver your disagreement, then hold eye contact for 3 full seconds of silence after the last word. Don't fill the silence.", why: "The silence after your point is where it either lands or dissolves. Holding through it asserts conviction." },
      { number: 2, action: "Record yourself removing every hedge word: no 'I think', no 'maybe', no 'I could be wrong'. Just the position.", why: "Hedges are learned habits — you won't notice them until you watch yourself without them" },
      { number: 3, action: "Practice the down-inflection finish: your voice should drop (not rise) at the end of your disagreement statement.", why: "Up-inflection (question intonation) signals you're seeking approval for your position. Down signals you're stating it." },
    ],
    tips: [
      { title: "The apology is in the body first", body: "Before you say 'I might be wrong but...', your body already said it. Posture shifts before words do. Fix the body first." },
      { title: "Down-inflection is the technique", body: "Rising intonation at the end of a statement turns it into a question — you're asking whether they accept your view. Down-inflection states it as fact." },
    ],
    nextClipId: score >= 70 ? "clip_014" : undefined,
    modelUsed: "gpt-4o",
    processingMs: 2900 + Math.round(Math.random() * 1300),
  };
}

const feedbackBySkill: Record<SkillCategory, (score: number, attempt: number) => FeedbackResult> = {
  "eye-contact":            eyeContactFeedback,
  "open-posture":           openPostureFeedback,
  "active-listening":       activeListeningFeedback,
  "vocal-pacing":           vocalPacingFeedback,
  "confident-disagreement": confidentDisagreementFeedback,
};

function microFeedback(skillFocus: string, verdict: "pass" | "needs-work"): MicroFeedback {
  const pass = verdict === "pass";
  const headlines: Record<string, [string, string]> = {
    "4-Second Hold":         ["Solid 4-second hold — eyes stayed locked",          "Hold broke at ~2 seconds — push to the full 4"],
    "Natural Side Break":    ["Clean break — looked sideways, not down",            "Break went downward — retrain to a lateral direction"],
    "Warm Eye Contact":      ["Warmth visible in the eyes — not just the mouth",    "Expression stayed neutral — let the smile reach the eyes"],
    "Hold Through Silence":  ["Held through 5 full seconds of silence — excellent", "Filled the silence at 3 seconds — push to 5"],
    "5-Second Lock":         ["5-second unblinking hold — very strong",             "Blink broke the hold early — practice the slow blink approach"],
    "Pause Before Response": ["Clean 2-second pause before answering",              "Response came immediately — build in the deliberate delay"],
    "Power Stance":          ["Wide stance held for the full 30 seconds",           "Weight shifted twice — practice redistribution"],
    "Open Chest":            ["Chest open, shoulders back — clean form",            "Shoulders rolled forward slightly — reset and retry"],
    "Forward Lean":          ["Lean timed to emotional beat — excellent",           "Leaning happened too early — wait for the emotional shift"],
    "Deliberate Nod":        ["One slow, deliberate nod — exactly right",           "Three fast nods — slow it right down to one"],
    "2-Second Pre-Impact Pause": ["Full 2-second pause before 'Carpe' — perfect",   "Pause was under 1 second — extend further"],
    "Quiet Opening":         ["Slow and quiet — the trap is set",                  "Opened too fast — slow the first two sentences right down"],
    "No-Apology Opening":    ["No hedge — started directly with the position",     "Hedge word detected at the start — remove it entirely"],
    "Level Vocal Register":  ["Volume and pitch stayed flat — strong control",     "Pitch rose at the end of the statement — bring it down"],
  };
  const [passHead, failHead] = headlines[skillFocus] ?? ["Good work on this step", "Keep practising this step"];
  return {
    verdict,
    headline: pass ? passHead : failHead,
    detail: pass
      ? `You executed the ${skillFocus} technique cleanly this rep. Lock in this feeling — that physical sense of control is what you're training toward.`
      : `The ${skillFocus} drill needs another rep. Focus on the single mechanical change described above — everything else is secondary until that one element clicks.`,
  };
}

// ─────────────────────────────────────────────────────────────
// Learner profiles
// ─────────────────────────────────────────────────────────────
const LEARNERS = [
  {
    email: "sarah.chen@example.com",
    name: "Sarah Chen",
    password: "SamplePass123!",
    onboardingComplete: true,
    skillBaselines: [
      { skillCategory: "eye-contact"            as SkillCategory, level: "beginner"     as SkillLevel, selfRating: "beginner"     as SkillLevel },
      { skillCategory: "open-posture"           as SkillCategory, level: "intermediate" as SkillLevel, selfRating: "intermediate" as SkillLevel },
      { skillCategory: "active-listening"       as SkillCategory, level: "intermediate" as SkillLevel, selfRating: "beginner"     as SkillLevel },
      { skillCategory: "vocal-pacing"           as SkillCategory, level: "beginner"     as SkillLevel, selfRating: "beginner"     as SkillLevel },
      { skillCategory: "confident-disagreement" as SkillCategory, level: "beginner"     as SkillLevel, selfRating: "beginner"     as SkillLevel },
    ],
    // [clipId, score, daysAgo, skill]
    sessions: [
      ["clip_001", 44, 21, "eye-contact"],
      ["clip_004", 58, 18, "open-posture"],
      ["clip_001", 56, 15, "eye-contact"],
      ["clip_007", 61, 12, "active-listening"],
      ["clip_004", 67, 9,  "open-posture"],
      ["clip_001", 69, 6,  "eye-contact"],
      ["clip_007", 74, 3,  "active-listening"],
      ["clip_001", 76, 1,  "eye-contact"],
    ] as [string, number, number, SkillCategory][],
    microSessions: [
      { clipId: "clip_001", stepNumber: 1, skillFocus: "4-Second Hold",        verdict: "pass" as const,       daysAgo: 6 },
      { clipId: "clip_001", stepNumber: 2, skillFocus: "Natural Side Break",   verdict: "needs-work" as const, daysAgo: 6 },
      { clipId: "clip_001", stepNumber: 2, skillFocus: "Natural Side Break",   verdict: "pass" as const,       daysAgo: 5 },
      { clipId: "clip_001", stepNumber: 3, skillFocus: "Warm Eye Contact",     verdict: "pass" as const,       daysAgo: 5 },
      { clipId: "clip_001", stepNumber: 4, skillFocus: "Hold Through Silence", verdict: "needs-work" as const, daysAgo: 4 },
    ],
  },
  {
    email: "marcus.williams@example.com",
    name: "Marcus Williams",
    password: "SamplePass123!",
    onboardingComplete: true,
    skillBaselines: [
      { skillCategory: "eye-contact"            as SkillCategory, level: "beginner" as SkillLevel, selfRating: "beginner" as SkillLevel },
      { skillCategory: "open-posture"           as SkillCategory, level: "beginner" as SkillLevel, selfRating: "beginner" as SkillLevel },
      { skillCategory: "active-listening"       as SkillCategory, level: "beginner" as SkillLevel, selfRating: "beginner" as SkillLevel },
      { skillCategory: "vocal-pacing"           as SkillCategory, level: "beginner" as SkillLevel, selfRating: "beginner" as SkillLevel },
      { skillCategory: "confident-disagreement" as SkillCategory, level: "beginner" as SkillLevel, selfRating: "beginner" as SkillLevel },
    ],
    sessions: [
      ["clip_001", 38, 7, "eye-contact"],
      ["clip_001", 52, 3, "eye-contact"],
    ] as [string, number, number, SkillCategory][],
    microSessions: [
      { clipId: "clip_001", stepNumber: 1, skillFocus: "4-Second Hold",      verdict: "needs-work" as const, daysAgo: 7 },
      { clipId: "clip_001", stepNumber: 1, skillFocus: "4-Second Hold",      verdict: "pass" as const,       daysAgo: 3 },
      { clipId: "clip_001", stepNumber: 2, skillFocus: "Natural Side Break", verdict: "needs-work" as const, daysAgo: 3 },
    ],
  },
  {
    email: "priya.patel@example.com",
    name: "Priya Patel",
    password: "SamplePass123!",
    onboardingComplete: true,
    skillBaselines: [
      { skillCategory: "eye-contact"            as SkillCategory, level: "advanced"      as SkillLevel, selfRating: "intermediate" as SkillLevel },
      { skillCategory: "open-posture"           as SkillCategory, level: "advanced"      as SkillLevel, selfRating: "advanced"     as SkillLevel },
      { skillCategory: "active-listening"       as SkillCategory, level: "intermediate"  as SkillLevel, selfRating: "intermediate" as SkillLevel },
      { skillCategory: "vocal-pacing"           as SkillCategory, level: "advanced"      as SkillLevel, selfRating: "advanced"     as SkillLevel },
      { skillCategory: "confident-disagreement" as SkillCategory, level: "intermediate"  as SkillLevel, selfRating: "intermediate" as SkillLevel },
    ],
    sessions: [
      ["clip_001", 72, 60, "eye-contact"],
      ["clip_002", 68, 55, "eye-contact"],
      ["clip_004", 79, 50, "open-posture"],
      ["clip_010", 74, 45, "vocal-pacing"],
      ["clip_002", 78, 40, "eye-contact"],
      ["clip_005", 81, 35, "open-posture"],
      ["clip_011", 76, 30, "vocal-pacing"],
      ["clip_013", 70, 25, "confident-disagreement"],
      ["clip_003", 75, 20, "eye-contact"],
      ["clip_007", 82, 18, "active-listening"],
      ["clip_014", 73, 14, "confident-disagreement"],
      ["clip_008", 85, 10, "active-listening"],
      ["clip_011", 84, 7,  "vocal-pacing"],
      ["clip_012", 80, 4,  "vocal-pacing"],
      ["clip_003", 88, 2,  "eye-contact"],
    ] as [string, number, number, SkillCategory][],
    microSessions: [
      { clipId: "clip_003", stepNumber: 1, skillFocus: "4-Second Hold",       verdict: "pass" as const, daysAgo: 20 },
      { clipId: "clip_003", stepNumber: 2, skillFocus: "5-Second Lock",       verdict: "pass" as const, daysAgo: 20 },
      { clipId: "clip_003", stepNumber: 3, skillFocus: "Still Body + Gaze",   verdict: "pass" as const, daysAgo: 19 },
      { clipId: "clip_012", stepNumber: 1, skillFocus: "Quiet Opening",       verdict: "pass" as const, daysAgo: 4 },
      { clipId: "clip_012", stepNumber: 2, skillFocus: "2-Second Pre-Impact Pause", verdict: "pass" as const, daysAgo: 4 },
    ],
  },
  {
    email: "jake.torres@example.com",
    name: "Jake Torres",
    password: "SamplePass123!",
    onboardingComplete: true,
    skillBaselines: [
      { skillCategory: "eye-contact"            as SkillCategory, level: "intermediate" as SkillLevel, selfRating: "intermediate" as SkillLevel },
      { skillCategory: "open-posture"           as SkillCategory, level: "intermediate" as SkillLevel, selfRating: "intermediate" as SkillLevel },
      { skillCategory: "active-listening"       as SkillCategory, level: "beginner"     as SkillLevel, selfRating: "beginner"     as SkillLevel },
      { skillCategory: "vocal-pacing"           as SkillCategory, level: "beginner"     as SkillLevel, selfRating: "beginner"     as SkillLevel },
      { skillCategory: "confident-disagreement" as SkillCategory, level: "intermediate" as SkillLevel, selfRating: "intermediate" as SkillLevel },
    ],
    sessions: [
      ["clip_002", 55, 30, "eye-contact"],
      ["clip_013", 58, 28, "confident-disagreement"],
      ["clip_002", 63, 24, "eye-contact"],
      ["clip_014", 60, 20, "confident-disagreement"],
      ["clip_013", 69, 15, "confident-disagreement"],
      ["clip_002", 71, 10, "eye-contact"],
      ["clip_014", 68, 6,  "confident-disagreement"],
      ["clip_014", 74, 2,  "confident-disagreement"],
    ] as [string, number, number, SkillCategory][],
    microSessions: [
      { clipId: "clip_013", stepNumber: 1, skillFocus: "No-Apology Opening",   verdict: "needs-work" as const, daysAgo: 15 },
      { clipId: "clip_013", stepNumber: 1, skillFocus: "No-Apology Opening",   verdict: "pass" as const,       daysAgo: 14 },
      { clipId: "clip_013", stepNumber: 2, skillFocus: "Level Vocal Register",  verdict: "needs-work" as const, daysAgo: 14 },
      { clipId: "clip_013", stepNumber: 2, skillFocus: "Level Vocal Register",  verdict: "pass" as const,       daysAgo: 13 },
      { clipId: "clip_014", stepNumber: 1, skillFocus: "No-Apology Opening",   verdict: "pass" as const,       daysAgo: 6 },
      { clipId: "clip_014", stepNumber: 2, skillFocus: "Level Vocal Register",  verdict: "pass" as const,       daysAgo: 6 },
    ],
  },
  {
    email: "emma.lindqvist@example.com",
    name: "Emma Lindqvist",
    password: "SamplePass123!",
    onboardingComplete: true,
    skillBaselines: [
      { skillCategory: "eye-contact"            as SkillCategory, level: "beginner"     as SkillLevel, selfRating: "beginner"     as SkillLevel },
      { skillCategory: "open-posture"           as SkillCategory, level: "beginner"     as SkillLevel, selfRating: "beginner"     as SkillLevel },
      { skillCategory: "active-listening"       as SkillCategory, level: "intermediate" as SkillLevel, selfRating: "beginner"     as SkillLevel },
      { skillCategory: "vocal-pacing"           as SkillCategory, level: "beginner"     as SkillLevel, selfRating: "beginner"     as SkillLevel },
      { skillCategory: "confident-disagreement" as SkillCategory, level: "beginner"     as SkillLevel, selfRating: "beginner"     as SkillLevel },
    ],
    sessions: [
      ["clip_007", 40, 35, "active-listening"],
      ["clip_007", 48, 30, "active-listening"],
      ["clip_007", 55, 25, "active-listening"],
      ["clip_007", 61, 21, "active-listening"],
      ["clip_008", 58, 18, "active-listening"],
      ["clip_008", 65, 14, "active-listening"],
      ["clip_007", 70, 10, "active-listening"],
      ["clip_008", 72, 7,  "active-listening"],
      ["clip_008", 75, 4,  "active-listening"],
      ["clip_008", 78, 1,  "active-listening"],
    ] as [string, number, number, SkillCategory][],
    microSessions: [
      { clipId: "clip_007", stepNumber: 1, skillFocus: "Forward Lean",      verdict: "needs-work" as const, daysAgo: 35 },
      { clipId: "clip_007", stepNumber: 1, skillFocus: "Forward Lean",      verdict: "pass" as const,       daysAgo: 30 },
      { clipId: "clip_007", stepNumber: 2, skillFocus: "Deliberate Nod",    verdict: "needs-work" as const, daysAgo: 30 },
      { clipId: "clip_007", stepNumber: 2, skillFocus: "Deliberate Nod",    verdict: "needs-work" as const, daysAgo: 25 },
      { clipId: "clip_007", stepNumber: 2, skillFocus: "Deliberate Nod",    verdict: "pass" as const,       daysAgo: 21 },
      { clipId: "clip_007", stepNumber: 3, skillFocus: "5-Second Silence Hold", verdict: "pass" as const,   daysAgo: 18 },
      { clipId: "clip_008", stepNumber: 1, skillFocus: "Forward Lean",      verdict: "pass" as const,       daysAgo: 14 },
      { clipId: "clip_008", stepNumber: 2, skillFocus: "Deliberate Nod",    verdict: "pass" as const,       daysAgo: 7 },
    ],
  },
  {
    email: "david.kim@example.com",
    name: "David Kim",
    password: "SamplePass123!",
    onboardingComplete: true,
    skillBaselines: [
      { skillCategory: "eye-contact"            as SkillCategory, level: "advanced" as SkillLevel, selfRating: "advanced"     as SkillLevel },
      { skillCategory: "open-posture"           as SkillCategory, level: "advanced" as SkillLevel, selfRating: "advanced"     as SkillLevel },
      { skillCategory: "active-listening"       as SkillCategory, level: "advanced" as SkillLevel, selfRating: "intermediate" as SkillLevel },
      { skillCategory: "vocal-pacing"           as SkillCategory, level: "advanced" as SkillLevel, selfRating: "advanced"     as SkillLevel },
      { skillCategory: "confident-disagreement" as SkillCategory, level: "advanced" as SkillLevel, selfRating: "advanced"     as SkillLevel },
    ],
    sessions: [
      ["clip_001", 71, 90, "eye-contact"],
      ["clip_004", 74, 87, "open-posture"],
      ["clip_010", 73, 85, "vocal-pacing"],
      ["clip_002", 76, 80, "eye-contact"],
      ["clip_005", 79, 77, "open-posture"],
      ["clip_007", 80, 75, "active-listening"],
      ["clip_011", 78, 70, "vocal-pacing"],
      ["clip_013", 75, 67, "confident-disagreement"],
      ["clip_003", 82, 60, "eye-contact"],
      ["clip_006", 80, 55, "open-posture"],
      ["clip_008", 84, 50, "active-listening"],
      ["clip_012", 83, 45, "vocal-pacing"],
      ["clip_014", 79, 40, "confident-disagreement"],
      ["clip_009", 85, 35, "active-listening"],
      ["clip_015", 82, 30, "confident-disagreement"],
      ["clip_003", 87, 21, "eye-contact"],
      ["clip_006", 86, 14, "open-posture"],
      ["clip_009", 89, 7,  "active-listening"],
      ["clip_012", 88, 4,  "vocal-pacing"],
      ["clip_015", 91, 2,  "confident-disagreement"],
    ] as [string, number, number, SkillCategory][],
    microSessions: [
      { clipId: "clip_015", stepNumber: 1, skillFocus: "No-Apology Opening", verdict: "pass" as const, daysAgo: 30 },
      { clipId: "clip_015", stepNumber: 2, skillFocus: "Level Vocal Register", verdict: "pass" as const, daysAgo: 30 },
      { clipId: "clip_015", stepNumber: 3, skillFocus: "Power Stance", verdict: "pass" as const, daysAgo: 29 },
      { clipId: "clip_015", stepNumber: 4, skillFocus: "No-Apology Opening", verdict: "pass" as const, daysAgo: 29 },
      { clipId: "clip_009", stepNumber: 1, skillFocus: "Forward Lean", verdict: "pass" as const, daysAgo: 7 },
      { clipId: "clip_009", stepNumber: 2, skillFocus: "Deliberate Nod", verdict: "pass" as const, daysAgo: 7 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("─── seeneyu sample data seed ───\n");

  // Fetch all clips so we can look them up by id string
  const clips = await prisma.clip.findMany({
    select: { id: true, youtubeVideoId: true, skillCategory: true },
  });
  const clipById = new Map(clips.map((c) => [c.id, c]));
  const clipByYoutubeId = new Map(clips.map((c) => [c.youtubeVideoId, c]));

  // Map seed clip_001..clip_015 ids → real DB ids
  // The seed JSON uses logical ids like "clip_001", actual DB ids are cuid strings.
  // We match by position in the seed file (ordered by skill/difficulty).
  const seedIdToDbId = new Map<string, string>();
  const seedOrder = [
    { seedId: "clip_001", ytId: "56fngopihOo" },
    { seedId: "clip_002", ytId: "6-_tIPShuwQ" },
    { seedId: "clip_003", ytId: "e_u2OJ6HXG4" },
    { seedId: "clip_004", ytId: "yc8qbcIMZVg" },
    { seedId: "clip_005", ytId: "odYTSVvpNa8" },
    { seedId: "clip_006", ytId: "aWt724ZWmJg" },
    { seedId: "clip_007", ytId: "6tqPK8nJL2U" },
    { seedId: "clip_008", ytId: "7WJts0gKCRM" },
    { seedId: "clip_009", ytId: "FDFdroN7d0w" },
    { seedId: "clip_010", ytId: "j64SctPKmqk" },
    { seedId: "clip_011", ytId: "isr4-tsfhsg" },
    { seedId: "clip_012", ytId: "1qjtugr2618" },
    { seedId: "clip_013", ytId: "GSu7BGbyJqc" },
    { seedId: "clip_014", ytId: "EqDd06GW76o" },
    { seedId: "clip_015", ytId: "jEFYjQb1K2E" },
  ];
  for (const { seedId, ytId } of seedOrder) {
    const clip = clipByYoutubeId.get(ytId);
    if (clip) seedIdToDbId.set(seedId, clip.id);
    else console.warn(`  WARN: clip not found in DB for ytId=${ytId}`);
  }

  let usersCreated = 0;
  let sessionsCreated = 0;
  let microCreated = 0;

  for (const learner of LEARNERS) {
    // ── User ──────────────────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email: learner.email } });
    if (existing) {
      console.log(`  SKIP  user ${learner.email} — already exists`);
      continue;
    }

    const passwordHash = await bcrypt.hash(learner.password, 10);
    const user = await prisma.user.create({
      data: {
        email: learner.email,
        name: learner.name,
        role: "learner",
        passwordHash,
        onboardingComplete: learner.onboardingComplete,
      },
    });
    console.log(`  OK    user ${learner.name} (${learner.email})`);
    usersCreated++;

    // ── SkillBaselines ────────────────────────────────────────
    for (const sb of learner.skillBaselines) {
      await prisma.skillBaseline.create({
        data: {
          userId: user.id,
          skillCategory: sb.skillCategory,
          level: sb.level,
          selfRating: sb.selfRating,
        },
      });
    }
    console.log(`        ${learner.skillBaselines.length} skill baselines created`);

    // ── UserSessions ──────────────────────────────────────────
    for (let i = 0; i < learner.sessions.length; i++) {
      const [seedClipId, score, days, skill] = learner.sessions[i];
      const dbClipId = seedIdToDbId.get(seedClipId);
      if (!dbClipId) {
        console.warn(`        WARN: no DB id for ${seedClipId} — skipping session`);
        continue;
      }

      const attempt = learner.sessions.slice(0, i).filter(s => s[0] === seedClipId).length + 1;
      const feedback = feedbackBySkill[skill](score, attempt);
      const createdAt = daysAgo(days);
      const completedAt = new Date(createdAt.getTime() + 5 * 60 * 1000 + Math.random() * 3 * 60 * 1000);

      await prisma.userSession.create({
        data: {
          clipId: dbClipId,
          userId: user.id,
          status: "complete",
          recordingUrl: null,     // no actual blob in sample data
          recordingKey: null,
          frameUrls: null,
          feedback: feedback as object,
          scores: { overallScore: feedback.overallScore, dimensions: feedback.dimensions } as object,
          createdAt,
          completedAt,
        },
      });
      sessionsCreated++;
    }
    console.log(`        ${learner.sessions.length} user sessions created`);

    // ── MicroSessions ─────────────────────────────────────────
    for (const ms of learner.microSessions) {
      const dbClipId = seedIdToDbId.get(ms.clipId);
      if (!dbClipId) continue;

      const fb = microFeedback(ms.skillFocus, ms.verdict);
      const createdAt = daysAgo(ms.daysAgo);

      await prisma.microSession.create({
        data: {
          clipId: dbClipId,
          stepNumber: ms.stepNumber,
          recordingUrl: null,
          frameUrls: null,
          audioUrl: null,
          transcript: null,
          feedback: fb as object,
          status: "complete",
          createdAt,
        },
      });
      microCreated++;
    }
    console.log(`        ${learner.microSessions.length} micro sessions created`);
    console.log();
  }

  // ── Summary ────────────────────────────────────────────────
  console.log("─── Sample data seed complete ───");
  console.log(`Users created:         ${usersCreated}`);
  console.log(`UserSessions created:  ${sessionsCreated}`);
  console.log(`MicroSessions created: ${microCreated}`);
  console.log();
  console.log("Sample learner credentials (all share the same password):");
  for (const l of LEARNERS) {
    console.log(`  ${l.email.padEnd(36)} SamplePass123!`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
