import type { FeedbackResult, ActionPlanStep, FeedbackTip, ObservationGuide } from '@/lib/types'
import type { FullPerformanceMetrics } from '@/services/expression-scorer'

interface PracticeStepCtx {
  stepNumber: number
  skillFocus: string
  instruction: string
  tip?: string | null
}

interface FeedbackContext {
  skillCategory: string
  characterName: string | null
  actorName?: string | null
  movieTitle: string
  sceneDescription: string
  script?: string | null
  /** The reference annotation describing what to look for in the scene */
  annotation?: string | null
  /** Per-moment observation guide with timestamps and techniques */
  observationGuide?: ObservationGuide | null
  /** The practice steps the user was instructed to perform */
  practiceSteps?: PracticeStepCtx[] | null
}

/**
 * Generate rich coaching feedback from numerical MediaPipe metrics.
 * Primary: GPT-4o TEXT prompt (no Vision) if OPENAI_API_KEY available.
 * Fallback: Template-based generation (zero AI dependency).
 */
export async function generateTextFeedback(
  metrics: FullPerformanceMetrics,
  ctx: FeedbackContext
): Promise<Omit<FeedbackResult, 'nextClipId' | 'processingMs'>> {
  // Try AI-powered text generation first
  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateWithAI(metrics, ctx)
    } catch (e) {
      console.warn('AI feedback generation failed, using templates:', e)
    }
  }

  return generateFromTemplates(metrics, ctx)
}

// ─── AI-Powered Generation (GPT-4o TEXT only, no Vision) ──────────────────

async function generateWithAI(
  metrics: FullPerformanceMetrics,
  ctx: FeedbackContext
): Promise<Omit<FeedbackResult, 'nextClipId' | 'processingMs'>> {
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const dimText = metrics.dimensions
    .map(d => `${d.label}: ${d.score}/10`)
    .join(', ')

  const characterLine = ctx.characterName
    ? `mimicking ${ctx.characterName}${ctx.actorName ? ` (${ctx.actorName})` : ''} from ${ctx.movieTitle}`
    : `practicing a scene from ${ctx.movieTitle}`

  // Build observation guide moments text (the specific things the user was told to watch for)
  const guideMomentsText = ctx.observationGuide?.moments?.length
    ? ctx.observationGuide.moments
        .map((m, i) => `  ${i + 1}. At ${m.atSecond}s — ${m.technique}: ${m.what} (Why: ${m.why})`)
        .join('\n')
    : ''

  // Build practice steps text (the specific exercises the user was instructed to perform)
  const stepsText = ctx.practiceSteps?.length
    ? ctx.practiceSteps
        .map(s => `  Step ${s.stepNumber} — ${s.skillFocus}: ${s.instruction}${s.tip ? ` (Tip: ${s.tip})` : ''}`)
        .join('\n')
    : ''

  const sortedDims = [...metrics.dimensions].sort((a, b) => a.score - b.score)
  const bestDim = sortedDims[sortedDims.length - 1]
  const worstDim = sortedDims[0]

  const prompt = `You are an expert body language coach analyzing a student's practice attempt. YOU MUST make this feedback SPECIFIC to THIS clip — generic feedback that could apply to any clip is forbidden.

━━ THE SCENE THEY PRACTICED ━━
Character: ${ctx.characterName ?? 'N/A'} (${ctx.actorName ?? 'actor unknown'}) in ${ctx.movieTitle}
Skill: ${ctx.skillCategory.replace('-', ' ')}
Scene detail: ${ctx.sceneDescription}
${ctx.annotation ? `What to look for: ${ctx.annotation}` : ''}
${ctx.script ? `Script they practiced: "${String(ctx.script).slice(0, 300)}"` : ''}

${guideMomentsText ? `✓ KEY MOMENTS THEY WERE TOLD TO WATCH:\n${guideMomentsText}` : ''}
${stepsText ? `\n✓ PRACTICE STEPS THEY WERE INSTRUCTED TO FOLLOW:\n${stepsText}` : ''}

━━ THEIR ACTUAL PERFORMANCE ━━
Overall: ${metrics.overallScore}/100
Best: ${bestDim.label} (${bestDim.score}/100) — they nailed this
Weakest: ${worstDim.label} (${worstDim.score}/100) — focus here
All scores: ${dimText}

━━ YOUR JOB ━━
Write feedback that makes them feel like a coach watched them practice THIS specific scene. Every sentence must reference:
- The character they mimicked (${ctx.characterName ?? 'the character'})
- A specific observation moment (with timestamp)
- A practice step they attempted
- A dimension score they got
- OR something unique about this scene

EXAMPLES OF GOOD FEEDBACK:
- BAD: "Work on eye contact."
- GOOD: "When you mimicked Marcus's confrontation stance at 12s, your eye contact held for 3 seconds, which matches his intensity. But his jaw stays slightly clenched—yours relaxed. Try the Step 2 exercise: mirror his jaw tension for 5 seconds."

- BAD: "Your hand gestures were good."
- GOOD: "In the scene where Cardi signs the deal, your hand opening at 8s was nearly perfect (Hand Openness: 9/10), but you broke the gesture too early. His hands stay open for the full 4-second beat."

Generate coaching feedback as strict JSON (no markdown, no extra text):
{
  "summary": "<1-2 punchy sentences using the character name, scene context, and comparing their strongest vs weakest score. EXAMPLE: 'You captured Don's cold authority—your stillness was impeccable (Timing: 94/100). But his jaw stays tensely shut, and yours was too relaxed (Facial Expression: 48/100). That tension is key to the power.'>",
  "positives": [
    "<ONE specific thing they did well. Name a body part + dimension score + reference the character/moment. Example: 'At 12s, your forward lean matched Cardi's engagement perfectly (Forward Lean: 8/10), showing you understand how her active listening looks.'>",
    "<ANOTHER specific positive from a different moment or dimension. Include score.>"
  ],
  "improvements": [
    "<ONE correction tied to their lowest-scoring dimension AND this specific scene. Include a 15-second micro-exercise. Example: 'You relaxed your jaw, but Don keeps it tight—watch 11-15s of the clip again. Try this: clench your teeth lightly while saying 'I'm not angry' 3 times to build muscle memory.'>",
    "<ANOTHER correction with a specific practice step or moment timestamp.>"
  ],
  "steps": [
    {"number": 1, "action": "<A 20-second warmup targeting their weakest dimension, referencing this scene>", "why": "<Why this matters for the character they're mimicking>"},
    {"number": 2, "action": "<A 30-second drill combining observation moment + practice step they partially missed>", "why": "<How this builds on step 1 AND the character's behavior>"},
    {"number": 3, "action": "<Record themselves doing steps 1+2 together, then compare to the original clip>", "why": "<How this integrates everything for this specific scene>"}
  ],
  "tips": [
    {"title": "<A specific technique FROM THE CLIP (e.g., 'Tight Jaw Authority' or 'The Cold Stare')>", "body": "<3-4 sentences explaining HOW the character uses this technique at a specific moment in the scene, then a micro-exercise the student should try. Reference timestamps.>"},
    {"title": "<Another technique unique to this character/scene>", "body": "<Same: HOW the character does it, specific example from the clip, micro-exercise.>"}
  ]
}

DO NOT GENERIC. If a sentence could work for ANY ${ctx.skillCategory.replace('-', ' ')} practice, DELETE IT and rewrite it with a character name, scene detail, or score reference.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.choices[0]?.message?.content ?? ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')

  const parsed = JSON.parse(jsonMatch[0])

  return {
    overallScore: metrics.overallScore,
    dimensions: metrics.dimensions,
    summary: parsed.summary || templateSummary(metrics.overallScore, ctx),
    positives: parsed.positives || templatePositives(metrics, ctx),
    improvements: parsed.improvements || templateImprovements(metrics, ctx),
    steps: parsed.steps || templateSteps(metrics, ctx),
    tips: parsed.tips || templateTips(ctx.skillCategory),
    modelUsed: 'mediapipe+gpt-4o-text',
  }
}

// ─── Template-Based Generation (zero AI dependency) ────────────────────────

function generateFromTemplates(
  metrics: FullPerformanceMetrics,
  ctx: FeedbackContext
): Omit<FeedbackResult, 'nextClipId' | 'processingMs'> {
  return {
    overallScore: metrics.overallScore,
    dimensions: metrics.dimensions,
    summary: templateSummary(metrics.overallScore, ctx),
    positives: templatePositives(metrics, ctx),
    improvements: templateImprovements(metrics, ctx),
    steps: templateSteps(metrics, ctx),
    tips: templateTips(ctx.skillCategory),
    modelUsed: 'mediapipe-local',
  }
}

function templateSummary(score: number, ctx: FeedbackContext): string {
  const skillName = ctx.skillCategory.replace(/-/g, ' ')
  const character = ctx.characterName ? ` as ${ctx.characterName}` : ''
  const movie = ctx.movieTitle ? ` (${ctx.movieTitle})` : ''

  if (score >= 80) return `Excellent ${skillName} work${character}${movie}! Your performance shows strong command of this technique.`
  if (score >= 60) return `Good progress on ${skillName}${character}${movie}. You're building solid foundations—keep refining the details below.`
  if (score >= 40) return `You're developing your ${skillName} skills${character}${movie}. Focus on the action steps below to tighten your technique.`
  return `${skillName.charAt(0).toUpperCase() + skillName.slice(1)} requires deliberate practice. Work through the exercises below and record again—you'll see rapid improvement.`
}

const SKILL_POSITIVES: Record<string, string[][]> = {
  'eye-contact': [
    ['Good gaze stability during key moments', 'You maintained forward-facing focus well'],
    ['Your eye opening was natural and engaged', 'Eye direction was consistent'],
  ],
  'open-posture': [
    ['Your chest was open and shoulders relaxed', 'Good spatial awareness and stance'],
    ['Arms positioned openly — inviting body language', 'Spine alignment looked natural'],
  ],
  'active-listening': [
    ['Your body showed attentive positioning', 'Facial expressions reflected engagement'],
    ['Good forward lean showing interest', 'Your stillness conveyed focus'],
  ],
  'vocal-pacing': [
    ['Your overall rhythm felt natural', 'Good variation in delivery pace'],
    ['You used pauses effectively', 'Your tempo kept things engaging'],
  ],
  'confident-disagreement': [
    ['Your posture stayed stable and grounded', 'You maintained composure well'],
    ['Body language projected calm confidence', 'Good eye contact during difficult moments'],
  ],
  'hand-gestures': [
    ['Good hand openness — your gestures felt inviting', 'Your hand positioning enhanced your message'],
    ['Nice variety of gestures throughout', 'Your finger spread showed natural expressiveness'],
  ],
}

function templatePositives(metrics: FullPerformanceMetrics, ctx: FeedbackContext): string[] {
  const skill = ctx.skillCategory
  const pool = SKILL_POSITIVES[skill] ?? SKILL_POSITIVES['eye-contact']
  const bestDim = metrics.dimensions.reduce((best, d) => d.score > best.score ? d : best)
  const idx = metrics.dimensions.indexOf(bestDim)
  const set = pool[Math.min(idx, pool.length - 1)]

  // If we have character context, prefix with character-specific encouragement
  if (ctx.characterName && set) {
    const character = ctx.characterName
    return [
      `${character}'s ${skill.replace(/-/g, ' ')} has that quality—and you captured it: ${set[0]}`,
      set[1],
    ]
  }
  return set
}

const SKILL_IMPROVEMENTS: Record<string, string[][]> = {
  'eye-contact': [
    ['Try holding your gaze for 3-5 seconds before natural breaks', 'Practice looking at a fixed point while speaking'],
    ['Work on reducing rapid eye movements', 'Focus on keeping your eyes open and relaxed'],
  ],
  'open-posture': [
    ['Roll your shoulders back before starting', 'Keep your hands visible and uncrossed'],
    ['Widen your stance slightly for a more grounded feel', 'Practice keeping your chest lifted'],
  ],
  'active-listening': [
    ['Add small nods at natural pause points', 'Mirror the speaker\'s energy with your posture'],
    ['Lean in slightly to show engagement', 'Reduce fidgeting to project calm attention'],
  ],
  'vocal-pacing': [
    ['Add a 1-second pause before key points', 'Vary your speed — slow down for emphasis'],
    ['Practice the 3-beat rule: speak, pause, continue', 'Work on volume contrast between sections'],
  ],
  'confident-disagreement': [
    ['Keep your weight centered — avoid shifting', 'Maintain eye contact when making your point'],
    ['Take a breath before responding to stay composed', 'Keep your voice steady and measured'],
  ],
  'hand-gestures': [
    ['Open your palms outward when presenting a point', 'Raise your hands to chest height for emphasis'],
    ['Vary between open-palm and pointing gestures', 'Avoid keeping hands at your sides — use them to illustrate'],
  ],
}

function templateImprovements(metrics: FullPerformanceMetrics, ctx: FeedbackContext): string[] {
  const skill = ctx.skillCategory
  const pool = SKILL_IMPROVEMENTS[skill] ?? SKILL_IMPROVEMENTS['eye-contact']
  const worstDim = metrics.dimensions.reduce((worst, d) => d.score < worst.score ? d : worst)
  const idx = metrics.dimensions.indexOf(worstDim)
  const set = pool[Math.min(idx, pool.length - 1)]

  // If we have character context, add character-specific guidance
  if (ctx.characterName && ctx.annotation && set) {
    const character = ctx.characterName
    return [
      `Watch how ${character} handles ${worstDim.label.toLowerCase()} in the scene: ${ctx.annotation}. Then: ${set[0]}`,
      set[1],
    ]
  }
  return set
}

function templateSteps(metrics: FullPerformanceMetrics, ctx: FeedbackContext): ActionPlanStep[] {
  const sorted = [...metrics.dimensions].sort((a, b) => a.score - b.score)
  const character = ctx.characterName ?? 'the character'
  const movieRef = ctx.movieTitle ? ` (like ${character} in ${ctx.movieTitle})` : ''

  const steps: ActionPlanStep[] = sorted.slice(0, 3).map((dim, i) => ({
    number: i + 1,
    action: `Drill ${dim.label.toLowerCase()}${movieRef}`,
    why: dim.score <= 5
      ? `Scoring ${dim.score}/10, this is your biggest opportunity. Watch how ${character} handles this, then mirror it for 30 seconds.`
      : `At ${dim.score}/10, tightening this dimension will push your overall score meaningfully higher. Practice the specific movements ${character} uses.`,
  }))
  return steps
}

const SKILL_TIPS: Record<string, FeedbackTip[]> = {
  'eye-contact': [
    { title: 'The Triangle Technique', body: 'Move your gaze in a triangle between the person\'s left eye, right eye, and mouth. This feels natural and maintains engagement without staring.' },
    { title: 'Break-and-Return', body: 'Look away briefly every 3-5 seconds, then return. Breaking gaze downward signals thinking; sideways signals recall. Avoid looking up, which signals disinterest.' },
  ],
  'open-posture': [
    { title: 'The Power Reset', body: 'Before any important moment, roll your shoulders back, lift your chin slightly, and take a deep breath. This instantly opens your posture and projects confidence.' },
    { title: 'Hands Tell Stories', body: 'Keep your hands visible and use them to emphasize points. Steepled fingers project certainty. Open palms signal honesty. Avoid crossing arms or hiding hands.' },
  ],
  'active-listening': [
    { title: 'The Lean-In Rule', body: 'Lean forward about 10-15 degrees when someone is making an important point. This subtle shift communicates deep interest without invading space.' },
    { title: 'Micro-Nod Timing', body: 'Nod slightly at natural pause points in the speaker\'s rhythm. One slow nod = understanding. Two quick nods = encouragement to continue.' },
  ],
  'vocal-pacing': [
    { title: 'The Power Pause', body: 'Pause for a full beat before your most important word or phrase. Silence creates anticipation and makes your key point land with more impact.' },
    { title: 'Speed Contrast', body: 'Speed up slightly for exciting details, then slow down for key conclusions. This contrast keeps listeners engaged and highlights what matters most.' },
  ],
  'confident-disagreement': [
    { title: 'Ground & Center', body: 'Plant both feet firmly and keep your weight balanced. A stable base projects calmness even during heated moments. Avoid swaying or stepping back.' },
    { title: 'The Measured Response', body: 'Take one slow breath before responding to something you disagree with. This micro-pause prevents reactive body language and gives you a moment to compose your response.' },
  ],
  'hand-gestures': [
    { title: 'The Gesture Zone', body: 'Keep hand gestures between your waist and shoulders — the "power zone". Gestures above or below this range feel erratic or weak. Match gesture size to your message impact.' },
    { title: 'Open Palm Authority', body: 'Showing open palms signals honesty and openness. Pointing with fingers can feel aggressive — use an open-hand gesture to direct attention instead.' },
  ],
}

// ── Voice-Aware Feedback Templates ──────────────────────────────────

const VOICE_TIPS: Record<string, FeedbackTip[]> = {
  'vocal-pacing': [
    { title: 'Pitch Variety', body: 'Vary your pitch by 50-100Hz when transitioning between points. A monotone pitch (< 30Hz range) puts listeners to sleep. Practice "upward" inflection for questions and "downward" for statements.' },
    { title: 'Strategic Pausing', body: 'Insert 0.5-1 second pauses before key points. Your current pause pattern shows room for more deliberate silence. Pauses create anticipation and give listeners time to absorb.' },
  ],
  'confident-disagreement': [
    { title: 'Vocal Steadiness', body: 'Keep your volume consistent when disagreeing — sudden increases sound aggressive, drops sound uncertain. Aim for a steady 3-5 dB range within sentences.' },
    { title: 'Measured Tempo', body: 'Slow your speaking rate to ~3 syllables/sec when making a counterpoint. Rushing signals anxiety; measured delivery signals confidence and control.' },
  ],
}

function templateTips(skill: string): FeedbackTip[] {
  return SKILL_TIPS[skill] ?? SKILL_TIPS['eye-contact']
}

/** Get voice-specific tips when voice analysis is available */
export function getVoiceTips(skill: string): FeedbackTip[] {
  return VOICE_TIPS[skill] ?? []
}
