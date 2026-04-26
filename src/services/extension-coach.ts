// Coach Ney write-up generator for Mirror Mode sessions. Same voice as the
// platform's recorded-practice feedback (src/services/feedback-generator.ts)
// but adapted for live-meeting context — works from time-series metrics only,
// no video. Uses GPT-4o (text). Falls back to a deterministic template if the
// API key is missing or the call fails.

import OpenAI from 'openai'

export interface SessionInput {
  durationSeconds: number
  averages: {
    eyeContactPct: number | null
    posture: number | null
    pace: number | null
  }
  timeSeries: Array<{
    t: number
    eyeContact: number | null
    posture: number | null
    pace: number | null
  }>
  nudges: Array<{ at: number; pattern: string; headline: string }>
}

export interface CoachWriteup {
  headline: string
  summary: string
  whatWorked: string[]
  whatToImprove: string[]
  nextSteps: string[]
}

const SYSTEM_PROMPT = `You are Coach Ney, the body-language and communication coach inside Seeneyu.

You just observed a user during a real Zoom / Meet / Teams meeting through a privacy-respecting browser extension. You did not see the video — you have only the time-series of three metrics: eye contact percentage (0-100), posture score (0-100, where higher is more upright), and vocal pacing in words per minute (target range 120-160). You also have the live coaching nudges that fired during the session.

Voice: warm, specific, action-oriented. Reference concrete moments by minute mark. Avoid generic advice — every recommendation should be grounded in the specific data you see.

Output a JSON object with:
- headline: 6-10 word punchy summary of how it went
- summary: one paragraph (60-90 words) describing what happened in narrative form
- whatWorked: 2-3 short bullets (≤14 words each) of strengths grounded in the data
- whatToImprove: 2-3 short bullets of specific weaknesses grounded in the data
- nextSteps: 3 concrete, actionable practices the user can do before their next meeting

Rules:
- Reference real numbers from the data.
- Mention specific minute marks when patterns appear.
- If a nudge fired, acknowledge whether the user appeared to act on it.
- Do not invent observations the metrics don't support.
- Do not mention the camera, video, or your inability to see it.`

function buildUserPrompt(input: SessionInput): string {
  const mins = Math.round((input.durationSeconds / 60) * 10) / 10
  const avg = input.averages
  const timeline = input.timeSeries
    .filter((_, i) => i % Math.max(1, Math.floor(input.timeSeries.length / 24)) === 0)
    .map((p) => `${formatTime(p.t)} eye:${p.eyeContact ?? '–'}% posture:${p.posture ?? '–'} pace:${p.pace ?? '–'}wpm`)
    .join('\n')
  const nudges = input.nudges.length
    ? input.nudges.map((n) => `${formatTime(n.at)} — ${n.pattern}: ${n.headline}`).join('\n')
    : '(no live nudges fired)'

  return `Session length: ${mins} minutes
Averages — eye contact: ${avg.eyeContactPct ?? 'n/a'}%, posture: ${avg.posture ?? 'n/a'}/100, pace: ${avg.pace ?? 'n/a'} wpm

Sampled timeline (every ~${Math.max(1, Math.floor(input.timeSeries.length / 24))}s):
${timeline || '(no samples)'}

Live nudges that fired:
${nudges}

Write Coach Ney's post-session report. Return ONLY the JSON object — no prose around it, no markdown fences.`
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export async function generateCoachWriteup(input: SessionInput): Promise<CoachWriteup> {
  if (!process.env.OPENAI_API_KEY) {
    return templateWriteup(input)
  }
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    })
    const raw = completion.choices[0]?.message?.content
    if (!raw) return templateWriteup(input)
    const parsed = JSON.parse(raw) as Partial<CoachWriteup>
    return {
      headline: typeof parsed.headline === 'string' ? parsed.headline : templateHeadline(input),
      summary: typeof parsed.summary === 'string' ? parsed.summary : templateSummary(input),
      whatWorked: Array.isArray(parsed.whatWorked) ? parsed.whatWorked.slice(0, 4).map(String) : [],
      whatToImprove: Array.isArray(parsed.whatToImprove) ? parsed.whatToImprove.slice(0, 4).map(String) : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.slice(0, 4).map(String) : [],
    }
  } catch (err) {
    console.error('[extension-coach] AI generation failed, falling back to template', err)
    return templateWriteup(input)
  }
}

// Deterministic fallback when AI is unavailable.
function templateWriteup(input: SessionInput): CoachWriteup {
  return {
    headline: templateHeadline(input),
    summary: templateSummary(input),
    whatWorked: templateWorked(input),
    whatToImprove: templateImprove(input),
    nextSteps: templateNextSteps(input),
  }
}

function templateHeadline(input: SessionInput): string {
  const e = input.averages.eyeContactPct
  const p = input.averages.posture
  if (e !== null && e >= 70 && p !== null && p >= 70) return 'Locked-in delivery from start to finish'
  if (e !== null && e < 50) return 'Strong session — eye contact needs work'
  if (p !== null && p < 50) return 'Good rapport, posture drifted'
  return 'Solid session with room to sharpen'
}

function templateSummary(input: SessionInput): string {
  const mins = Math.round(input.durationSeconds / 60)
  const e = input.averages.eyeContactPct
  const p = input.averages.posture
  const pace = input.averages.pace
  return `You ran a ${mins}-minute session. Average eye contact landed at ${e ?? 'n/a'}%, posture at ${p ?? 'n/a'}/100, and pace around ${pace ?? 'n/a'} wpm. The metrics tell a coherent story — keep building on what's working and pick one of the items below for next time.`
}

function templateWorked(input: SessionInput): string[] {
  const out: string[] = []
  if ((input.averages.eyeContactPct ?? 0) >= 65) out.push('Eye contact stayed connected to the camera lens for most of the session.')
  if ((input.averages.posture ?? 0) >= 65) out.push('Posture held upright — you projected presence and ownership.')
  const pace = input.averages.pace
  if (pace !== null && pace >= 120 && pace <= 160) out.push('Pace sat in the conversational sweet spot.')
  if (out.length === 0) out.push('You showed up and ran a real session — that\'s the practice that compounds.')
  return out
}

function templateImprove(input: SessionInput): string[] {
  const out: string[] = []
  if ((input.averages.eyeContactPct ?? 100) < 50) out.push('Eye contact dipped — gaze drifted off-camera too often.')
  if ((input.averages.posture ?? 100) < 50) out.push('Posture slumped — energy slid lower as the session ran.')
  const pace = input.averages.pace
  if (pace !== null && pace > 170) out.push('Pace ran hot — your delivery felt rushed in the back half.')
  if (pace !== null && pace > 0 && pace < 90) out.push('Pace ran low — risk of monotone or losing the room.')
  if (out.length === 0) out.push('Nothing glaring — push for the next 5% on every dimension.')
  return out
}

function templateNextSteps(input: SessionInput): string[] {
  return [
    'Stick a small dot above your camera lens — re-anchor your gaze every time you start a sentence.',
    'Set a posture reset timer (every 7 minutes) — chest up, shoulders back, breath in.',
    'Open your next meeting with a deliberate slow line: "Hey everyone, give me one second to get set." Lock the calm pace from the first sentence.',
  ]
}
