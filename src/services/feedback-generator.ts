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

  const prompt = `You are an expert body language coach analyzing a student's practice attempt. You must reference the SPECIFIC clip and practice steps they followed — generic feedback is forbidden.

THIS SPECIFIC CLIP — what the student practiced:
- Skill focus: ${ctx.skillCategory.replace('-', ' ')}
- ${characterLine}
- Scene: ${ctx.sceneDescription}
${ctx.annotation ? `- Reference behavior to mimic: ${ctx.annotation}` : ''}
${ctx.script ? `- Dialogue: "${String(ctx.script).slice(0, 400)}"` : ''}

${guideMomentsText ? `KEY MOMENTS THE STUDENT WAS TOLD TO OBSERVE:\n${guideMomentsText}\n` : ''}
${stepsText ? `PRACTICE STEPS THE STUDENT WAS INSTRUCTED TO PERFORM:\n${stepsText}\n` : ''}

THEIR MEASURED PERFORMANCE (from MediaPipe analysis):
- Overall score: ${metrics.overallScore}/100
- Dimensions: ${dimText}

Your job: write feedback that explicitly references the clip context above. Do NOT write generic ${ctx.skillCategory.replace('-', ' ')} advice that could apply to any clip. Every sentence must connect to either:
(a) the specific scene/character they were mimicking,
(b) one of the observation moments above,
(c) one of the practice steps they followed, OR
(d) a specific dimension score they got.

Generate coaching feedback as JSON:
{
  "summary": "<2 sentences — must mention the character/scene by name AND reference at least one specific dimension score. Example: 'Your imitation of Don Corleone's restrained gaze captured the stillness well (Eye Opening: 8/10), but the head tilt was too pronounced compared to his subtle weight shift.'>",
  "positives": [
    "<specific observation tied to ONE of the observation moments OR practice steps above. Mention the moment timestamp or step number. Name a body part.>",
    "<another specific positive tied to a different moment/step>"
  ],
  "improvements": [
    "<specific correction referencing a SPECIFIC observation moment they missed OR practice step they didn't fully execute. Include a 'try this' exercise.>",
    "<another correction tied to their lowest-scoring dimension AND the reference behavior they were mimicking>"
  ],
  "steps": [
    {"number": 1, "action": "<physical action targeting their weakest dimension AND tied to the scene>", "why": "<reference the character/scene specifically>"},
    {"number": 2, "action": "<progressive exercise building on step 1, tied to one of the observation moments>", "why": "<connect to what the character does in the clip>"},
    {"number": 3, "action": "<integration exercise combining multiple elements from the practice steps>", "why": "<about achieving the natural quality the character has>"}
  ],
  "tips": [
    {"title": "<technique name from the scene>", "body": "<2-3 sentences with a specific exercise. Reference HOW the character in this scene uses this technique.>"},
    {"title": "<technique name>", "body": "<2-3 sentences targeting their second-weakest dimension. Reference one of the practice steps above.>"}
  ]
}

CRITICAL: If a sentence in your output could be copied to feedback for ANY ${ctx.skillCategory.replace('-', ' ')} clip, rewrite it to reference THIS specific clip. Mention the character's name, the scene, the timestamps of observation moments, or specific practice step numbers.`

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
    summary: parsed.summary || templateSummary(metrics.overallScore, ctx.skillCategory),
    positives: parsed.positives || templatePositives(metrics, ctx.skillCategory),
    improvements: parsed.improvements || templateImprovements(metrics, ctx.skillCategory),
    steps: parsed.steps || templateSteps(metrics, ctx.skillCategory),
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
    summary: templateSummary(metrics.overallScore, ctx.skillCategory),
    positives: templatePositives(metrics, ctx.skillCategory),
    improvements: templateImprovements(metrics, ctx.skillCategory),
    steps: templateSteps(metrics, ctx.skillCategory),
    tips: templateTips(ctx.skillCategory),
    modelUsed: 'mediapipe-local',
  }
}

function templateSummary(score: number, skill: string): string {
  const skillName = skill.replace(/-/g, ' ')
  if (score >= 80) return `Excellent ${skillName} performance! You're showing strong command of this skill.`
  if (score >= 60) return `Good progress on ${skillName}. You're building solid foundations — keep it up!`
  if (score >= 40) return `You're developing your ${skillName} skills. Focus on the action steps below to improve.`
  return `${skillName.charAt(0).toUpperCase() + skillName.slice(1)} takes practice. Review the tips below and try again — you'll get there!`
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

function templatePositives(metrics: FullPerformanceMetrics, skill: string): string[] {
  const pool = SKILL_POSITIVES[skill] ?? SKILL_POSITIVES['eye-contact']
  const bestDim = metrics.dimensions.reduce((best, d) => d.score > best.score ? d : best)
  const idx = metrics.dimensions.indexOf(bestDim)
  const set = pool[Math.min(idx, pool.length - 1)]
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

function templateImprovements(metrics: FullPerformanceMetrics, skill: string): string[] {
  const pool = SKILL_IMPROVEMENTS[skill] ?? SKILL_IMPROVEMENTS['eye-contact']
  const worstDim = metrics.dimensions.reduce((worst, d) => d.score < worst.score ? d : worst)
  const idx = metrics.dimensions.indexOf(worstDim)
  const set = pool[Math.min(idx, pool.length - 1)]
  return set
}

function templateSteps(metrics: FullPerformanceMetrics, skill: string): ActionPlanStep[] {
  const sorted = [...metrics.dimensions].sort((a, b) => a.score - b.score)
  const steps: ActionPlanStep[] = sorted.slice(0, 3).map((dim, i) => ({
    number: i + 1,
    action: `Focus on improving your ${dim.label.toLowerCase()}`,
    why: dim.score <= 5
      ? `This area scored ${dim.score}/10 — it's your biggest opportunity for growth.`
      : `At ${dim.score}/10, small improvements here will push your overall score higher.`,
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
