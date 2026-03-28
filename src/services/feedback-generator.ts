import type { FeedbackResult, ActionPlanStep, FeedbackTip } from '@/lib/types'
import type { FullPerformanceMetrics } from '@/services/expression-scorer'

interface FeedbackContext {
  skillCategory: string
  characterName: string | null
  actorName?: string | null
  movieTitle: string
  sceneDescription: string
  script?: string | null
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

  const prompt = `You are an expert body language coach analyzing a student's practice attempt.

The student was practicing: ${ctx.skillCategory.replace('-', ' ')}
${characterLine}
Scene: ${ctx.sceneDescription}
${ctx.script ? `Script: "${ctx.script}"` : ''}

Their MediaPipe analysis scores: Overall ${metrics.overallScore}/100, ${dimText}

Analyze their performance with SPECIFIC, ACTIONABLE feedback:

1. TECHNIQUE SCORES were measured as: ${dimText}

2. WHAT THEY DID WELL — be specific about exact movements/expressions observed. Name body parts, facial muscles (orbicularis oculi, zygomaticus, frontalis), and timing.

3. AREAS TO IMPROVE — give specific corrections, not generic advice:
   - Name the exact muscle group or body part
   - Describe what should change (direction, intensity, timing)
   - Give a "try this" exercise they can do immediately

4. COMPARISON TO REFERENCE — what matched and what differed from the target expression in the scene

5. NEXT STEP — what to practice next to build on this skill, with progressive difficulty

Generate coaching feedback as JSON:
{
  "summary": "<2 sentences — specific observations about their technique, referencing what matched the reference and what needs adjustment. NEVER say generic things like 'great job' without specifics.>",
  "positives": ["<specific observation naming exact body part/movement — e.g. 'Your eyebrow raise using the frontalis muscle was well-timed'>", "<another specific positive referencing the scene context>"],
  "improvements": ["<specific correction — e.g. 'Your orbicularis oculi (eye muscles) didn't fully engage — try squinting slightly while maintaining the brow raise'>", "<another specific correction with a concrete exercise>"],
  "steps": [
    {"number": 1, "action": "<specific physical action targeting their weakest dimension — name exact body part>", "why": "<why this matters for the skill, reference the scene>"},
    {"number": 2, "action": "<progressive exercise building on step 1>", "why": "<1 sentence connecting to the reference performance>"},
    {"number": 3, "action": "<integration exercise combining multiple elements>", "why": "<1 sentence about naturalness and timing>"}
  ],
  "tips": [
    {"title": "<technique name>", "body": "<2-3 sentences with a specific exercise. Include muscle names, hold durations, and repetitions. Reference how the character in the scene uses this technique.>"},
    {"title": "<technique name>", "body": "<2-3 sentences targeting their second-weakest dimension. Include a mirror exercise or recording exercise they can try.>"}
  ]
}

Be encouraging but HONEST. A score of 70+ means they're doing well but can still improve specific elements. Never give generic feedback — every sentence must reference a specific body part, movement, timing, or comparison to the reference scene.`

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
}

function templateTips(skill: string): FeedbackTip[] {
  return SKILL_TIPS[skill] ?? SKILL_TIPS['eye-contact']
}
