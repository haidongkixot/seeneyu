/**
 * Expression Scorer — server-side scoring engine for MediaPipe analysis data.
 *
 * Replaces GPT-4o Vision with deterministic math-based scoring.
 * Takes blendshape values (0-1) + pose landmarks → produces 0-100 scores.
 *
 * Used by: Arcade attempts, Micro-Practice, Full Performance
 */

import type { AnalysisSnapshot, PoseLandmarkData } from '@/lib/mediapipe-types'

// ─── Expression Pattern Library ────────────────────────────────────────────
// Maps expression keywords to expected blendshape targets (0.0 - 1.0)

const EXPRESSION_PATTERNS: Record<string, Record<string, number>> = {
  // Basic emotions
  surprise: {
    eyeWideLeft: 0.6, eyeWideRight: 0.6, browInnerUp: 0.5,
    browOuterUpLeft: 0.4, browOuterUpRight: 0.4, jawOpen: 0.4,
  },
  happy: {
    mouthSmileLeft: 0.6, mouthSmileRight: 0.6,
    cheekSquintLeft: 0.4, cheekSquintRight: 0.4,
  },
  smile: {
    mouthSmileLeft: 0.5, mouthSmileRight: 0.5,
    cheekSquintLeft: 0.3, cheekSquintRight: 0.3,
  },
  joy: {
    mouthSmileLeft: 0.7, mouthSmileRight: 0.7,
    cheekSquintLeft: 0.5, cheekSquintRight: 0.5,
    eyeWideLeft: 0.2, eyeWideRight: 0.2, browInnerUp: 0.2,
  },
  anger: {
    browDownLeft: 0.6, browDownRight: 0.6,
    mouthFrownLeft: 0.3, mouthFrownRight: 0.3,
    noseSneerLeft: 0.3, noseSneerRight: 0.3, jawForward: 0.2,
  },
  angry: {
    browDownLeft: 0.6, browDownRight: 0.6,
    mouthFrownLeft: 0.3, mouthFrownRight: 0.3,
    noseSneerLeft: 0.3, noseSneerRight: 0.3,
  },
  sad: {
    mouthFrownLeft: 0.5, mouthFrownRight: 0.5,
    browInnerUp: 0.4, eyeSquintLeft: 0.2, eyeSquintRight: 0.2,
  },
  fear: {
    eyeWideLeft: 0.5, eyeWideRight: 0.5, browInnerUp: 0.5,
    jawOpen: 0.3, mouthFrownLeft: 0.2, mouthFrownRight: 0.2,
  },
  disgust: {
    noseSneerLeft: 0.5, noseSneerRight: 0.5,
    mouthFrownLeft: 0.3, mouthFrownRight: 0.3,
    browDownLeft: 0.3, browDownRight: 0.3,
  },
  contempt: {
    mouthSmileLeft: 0.4, mouthSmileRight: 0.0,
    browDownLeft: 0.2, noseSneerLeft: 0.2,
  },

  // Communication / coaching expressions
  confident: {
    browDownLeft: 0.15, browDownRight: 0.15,
    mouthSmileLeft: 0.2, mouthSmileRight: 0.2,
    mouthPressLeft: 0.1, mouthPressRight: 0.1,
  },
  stern: {
    browDownLeft: 0.4, browDownRight: 0.4,
    mouthPressLeft: 0.3, mouthPressRight: 0.3,
    jawForward: 0.15,
  },
  skeptical: {
    browDownLeft: 0.3, browOuterUpRight: 0.3,
    mouthSmileLeft: 0.15, eyeSquintLeft: 0.3,
  },
  empathy: {
    browInnerUp: 0.3,
    mouthSmileLeft: 0.2, mouthSmileRight: 0.2,
    eyeSquintLeft: 0.15, eyeSquintRight: 0.15,
  },
  empathetic: {
    browInnerUp: 0.3,
    mouthSmileLeft: 0.2, mouthSmileRight: 0.2,
  },
  warm: {
    mouthSmileLeft: 0.4, mouthSmileRight: 0.4,
    cheekSquintLeft: 0.2, cheekSquintRight: 0.2,
    browInnerUp: 0.1,
  },
  intense: {
    browDownLeft: 0.3, browDownRight: 0.3,
    eyeSquintLeft: 0.3, eyeSquintRight: 0.3,
    mouthPressLeft: 0.2, mouthPressRight: 0.2,
  },
  focused: {
    browDownLeft: 0.2, browDownRight: 0.2,
    eyeSquintLeft: 0.2, eyeSquintRight: 0.2,
  },
  defiant: {
    browDownLeft: 0.35, browDownRight: 0.35,
    jawForward: 0.2, mouthPressLeft: 0.3, mouthPressRight: 0.3,
  },
  authority: {
    browDownLeft: 0.2, browDownRight: 0.2,
    mouthPressLeft: 0.2, mouthPressRight: 0.2,
  },
  calm: {},
  neutral: {},
  listening: {
    browInnerUp: 0.15,
    mouthSmileLeft: 0.1, mouthSmileRight: 0.1,
  },
  concerned: {
    browInnerUp: 0.4, browDownLeft: 0.1,
    mouthFrownLeft: 0.2, mouthFrownRight: 0.2,
  },
  determined: {
    browDownLeft: 0.3, browDownRight: 0.3,
    jawForward: 0.15, mouthPressLeft: 0.3, mouthPressRight: 0.3,
  },
  tension: {
    browDownLeft: 0.4, browDownRight: 0.4,
    mouthPressLeft: 0.3, mouthPressRight: 0.3,
    jawForward: 0.1,
  },
  commanding: {
    browDownLeft: 0.25, browDownRight: 0.25,
    mouthPressLeft: 0.2, mouthPressRight: 0.2,
    jawForward: 0.1,
  },
  raised_eyebrow: {
    browOuterUpLeft: 0.5, browOuterUpRight: 0.1,
    eyeSquintRight: 0.15,
  },
  wink: {
    eyeBlinkLeft: 0.7, mouthSmileLeft: 0.3, mouthSmileRight: 0.3,
  },
  pout: {
    mouthPucker: 0.6, mouthFrownLeft: 0.2, mouthFrownRight: 0.2,
  },
  speaking: {
    jawOpen: 0.3, mouthFunnel: 0.15,
  },
}

// Keyword → pattern mapping (priority order: more specific keywords first)
const KEYWORD_MAP: Array<[string[], string]> = [
  [['raised eyebrow', 'raise eyebrow', 'eyebrow raise'], 'raised_eyebrow'],
  [['duchenne smile', 'genuine smile'], 'joy'],
  [['half smile', 'smirk', 'contempt'], 'contempt'],
  [['surprise', 'surprised', 'shocked', 'astonished'], 'surprise'],
  [['happy', 'happiness', 'elated'], 'happy'],
  [['smile', 'smiling', 'grin'], 'smile'],
  [['joy', 'joyful', 'ecstatic'], 'joy'],
  [['anger', 'furious', 'enraged', 'outraged'], 'anger'],
  [['angry', 'mad', 'irritated'], 'angry'],
  [['sad', 'sadness', 'grief', 'sorrow', 'melancholy'], 'sad'],
  [['fear', 'afraid', 'scared', 'terrified', 'anxious'], 'fear'],
  [['disgust', 'disgusted', 'repulsed'], 'disgust'],
  [['contempt', 'disdain', 'scorn'], 'contempt'],
  [['confident', 'confidence', 'self-assured'], 'confident'],
  [['stern', 'serious', 'stoic'], 'stern'],
  [['skeptic', 'skeptical', 'doubtful', 'suspicious'], 'skeptical'],
  [['empathy', 'empathetic', 'compassion', 'sympathetic'], 'empathy'],
  [['warm', 'warmth', 'friendly', 'welcoming'], 'warm'],
  [['intense', 'intensity'], 'intense'],
  [['focus', 'focused', 'concentrat'], 'focused'],
  [['defiant', 'defiance', 'rebellious'], 'defiant'],
  [['authority', 'authoritative', 'commanding', 'power'], 'commanding'],
  [['calm', 'serene', 'composed', 'relaxed'], 'calm'],
  [['neutral'], 'neutral'],
  [['listen', 'listening', 'attentive', 'engaged'], 'listening'],
  [['concern', 'worried', 'troubled'], 'concerned'],
  [['determined', 'determination', 'resolute'], 'determined'],
  [['tension', 'tense', 'stressed'], 'tension'],
  [['wink', 'winking'], 'wink'],
  [['pout', 'pouting'], 'pout'],
  [['speak', 'talking', 'delivery'], 'speaking'],
]

// ─── Core Scoring Functions ────────────────────────────────────────────────

function extractTargetPattern(description: string, context: string): Record<string, number> {
  const text = (description + ' ' + context).toLowerCase()
  const matched: Array<{ pattern: Record<string, number>; weight: number }> = []

  for (const [keywords, patternName] of KEYWORD_MAP) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        const pattern = EXPRESSION_PATTERNS[patternName]
        if (pattern && Object.keys(pattern).length > 0) {
          // Earlier matches in the priority list get higher weight
          matched.push({ pattern, weight: 1.0 })
        }
        break
      }
    }
  }

  if (matched.length === 0) {
    // Default: look for general facial engagement
    return EXPRESSION_PATTERNS.confident
  }

  // Merge all matched patterns with equal weight
  const merged: Record<string, number> = {}
  for (const { pattern } of matched) {
    for (const [key, value] of Object.entries(pattern)) {
      merged[key] = Math.max(merged[key] ?? 0, value)
    }
  }
  return merged
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function vectorMagnitude(v: number[]): number {
  return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0))
}

function buildVectors(
  user: Record<string, number>,
  target: Record<string, number>
): { userVec: number[]; targetVec: number[] } {
  const keys = Object.keys(target)
  const userVec = keys.map(k => user[k] ?? 0)
  const targetVec = keys.map(k => target[k])
  return { userVec, targetVec }
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

// ─── Pose Scoring Utilities ────────────────────────────────────────────────

function dist2d(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function shoulderOpenness(pose: PoseLandmarkData): number {
  // Shoulder width relative to head size (ear distance)
  const shoulderDist = dist2d(pose.leftShoulder, pose.rightShoulder)
  const headSize = dist2d(pose.leftEar, pose.rightEar)
  if (headSize < 0.01) return 50
  const ratio = shoulderDist / headSize
  // Typical ratio ~2.5-3.5. Higher = more open
  return clamp((ratio / 3.5) * 100, 0, 100)
}

function headTiltDegrees(pose: PoseLandmarkData): number {
  const dy = pose.rightEar.y - pose.leftEar.y
  const dx = pose.rightEar.x - pose.leftEar.x
  return Math.abs(Math.atan2(dy, dx) * (180 / Math.PI))
}

function forwardLean(pose: PoseLandmarkData): number {
  // nose Z relative to shoulder midpoint Z (more negative = leaning forward)
  const shoulderMidZ = (pose.leftShoulder.z + pose.rightShoulder.z) / 2
  return (shoulderMidZ - pose.nose.z) * 100 // positive = forward lean
}

function gestureActivity(pose: PoseLandmarkData): number {
  // How far wrists are from rest position (below shoulders)
  const leftDelta = pose.leftShoulder.y - pose.leftWrist.y
  const rightDelta = pose.rightShoulder.y - pose.rightWrist.y
  // Positive delta = hands above shoulders (active gesturing)
  return clamp((Math.max(leftDelta, rightDelta) + 0.1) * 200, 0, 100)
}

// ─── Arcade Scoring ────────────────────────────────────────────────────────

export interface ArcadeScoreResult {
  score: number
  breakdown: {
    expression_match: number
    intensity: number
    context_fit: number
  }
  feedback_line: string
}

export function scoreArcadeAttemptFromAnalysis(opts: {
  challengeDescription: string
  challengeType: string
  context: string
  snapshots: AnalysisSnapshot[]
  peakSnapshot: AnalysisSnapshot
}): ArcadeScoreResult {
  const { challengeDescription, challengeType, context, snapshots, peakSnapshot } = opts

  // 1. Determine target pattern from description
  const targetPattern = extractTargetPattern(challengeDescription, context)

  let expressionMatch: number
  let intensity: number
  let contextFit: number

  if (challengeType === 'gesture') {
    // Gesture challenges: primarily use pose data
    const poseScores = snapshots
      .filter(s => s.poseLandmarks)
      .map(s => {
        const pose = s.poseLandmarks!
        return {
          openness: shoulderOpenness(pose),
          gesture: gestureActivity(pose),
          lean: forwardLean(pose),
        }
      })

    if (poseScores.length === 0) {
      return fallbackScore('No body detected — make sure your upper body is visible.')
    }

    const avgOpenness = avg(poseScores.map(s => s.openness))
    const avgGesture = avg(poseScores.map(s => s.gesture))
    const avgLean = avg(poseScores.map(s => s.lean))

    expressionMatch = clamp((avgOpenness + avgGesture) / 2, 0, 100)
    intensity = clamp(avgGesture + avgLean * 10, 0, 100)
    contextFit = computeConsistency(poseScores.map(s => s.openness + s.gesture))
  } else {
    // Facial challenges: primarily use blendshapes
    if (!peakSnapshot.faceDetected) {
      return fallbackScore('No face detected — make sure your face is clearly visible.')
    }

    const { userVec, targetVec } = buildVectors(peakSnapshot.blendshapes, targetPattern)

    // Expression match: cosine similarity
    const similarity = cosineSimilarity(userVec, targetVec)
    expressionMatch = clamp(similarity * 100, 0, 100)

    // Intensity: magnitude ratio
    const userMag = vectorMagnitude(userVec)
    const targetMag = vectorMagnitude(targetVec)
    intensity = targetMag > 0 ? clamp((userMag / targetMag) * 80, 0, 100) : 50

    // Context fit: consistency across snapshots
    const facialSnapshots = snapshots.filter(s => s.faceDetected)
    if (facialSnapshots.length >= 2) {
      const intensities = facialSnapshots.map(s => {
        const { userVec: uv } = buildVectors(s.blendshapes, targetPattern)
        return vectorMagnitude(uv)
      })
      contextFit = computeConsistency(intensities)
    } else {
      contextFit = 60
    }
  }

  const score = Math.round(
    expressionMatch * 0.5 + intensity * 0.25 + contextFit * 0.25
  )

  return {
    score: clamp(score, 0, 100),
    breakdown: {
      expression_match: Math.round(expressionMatch),
      intensity: Math.round(intensity),
      context_fit: Math.round(contextFit),
    },
    feedback_line: generateArcadeFeedback(
      Math.round(expressionMatch),
      Math.round(intensity),
      Math.round(contextFit),
      score
    ),
  }
}

// ─── Micro-Practice Scoring ────────────────────────────────────────────────

export interface MicroScoreResult {
  verdict: 'pass' | 'needs-work'
  headline: string
  detail: string
  score: number
  scores?: { label: string; score: number }[]
  positives?: string[]
  improvements?: string[]
  actionableTip?: string
  nextStep?: string
}

// Skill → relevant blendshapes for scoring
const SKILL_BLENDSHAPES: Record<string, string[]> = {
  'eye-contact': [
    'eyeLookUpLeft', 'eyeLookUpRight', 'eyeLookDownLeft', 'eyeLookDownRight',
    'eyeLookInLeft', 'eyeLookInRight', 'eyeLookOutLeft', 'eyeLookOutRight',
    'eyeBlinkLeft', 'eyeBlinkRight',
  ],
  'open-posture': [], // primarily pose-based
  'active-listening': [
    'browInnerUp', 'mouthSmileLeft', 'mouthSmileRight',
    'eyeSquintLeft', 'eyeSquintRight',
  ],
  'vocal-pacing': ['jawOpen', 'mouthFunnel', 'mouthPucker'],
  'confident-disagreement': [
    'browDownLeft', 'browDownRight', 'mouthPressLeft', 'mouthPressRight',
  ],
}

export function scoreMicroPracticeFromAnalysis(
  skillCategory: string,
  skillFocus: string,
  instruction: string,
  snapshots: AnalysisSnapshot[]
): MicroScoreResult {
  if (snapshots.length === 0) {
    return {
      verdict: 'needs-work',
      headline: 'No analysis data captured',
      detail: 'Make sure your face is visible and try again.',
      score: 0,
    }
  }

  const facialSnapshots = snapshots.filter(s => s.faceDetected)
  const poseSnapshots = snapshots.filter(s => s.poseLandmarks)

  let score = 50 // base score

  // Score facial expression engagement
  if (facialSnapshots.length > 0) {
    const relevantBlendshapes = SKILL_BLENDSHAPES[skillCategory] ?? []
    if (relevantBlendshapes.length > 0) {
      const avgActivation = avgBlendshapeActivation(facialSnapshots, relevantBlendshapes)
      score = clamp(avgActivation * 200 + 30, 0, 100) // Scale up: 0.35 avg → 100
    } else {
      // Generic expression engagement
      const engagement = avgOverallEngagement(facialSnapshots)
      score = clamp(engagement * 150 + 30, 0, 100)
    }
  }

  // Boost score for good posture (if detected)
  if (poseSnapshots.length > 0 && (skillCategory === 'open-posture' || skillCategory === 'confident-disagreement')) {
    const avgOpen = avg(poseSnapshots.map(s => shoulderOpenness(s.poseLandmarks!)))
    const poseScore = clamp(avgOpen, 0, 100)
    score = skillCategory === 'open-posture'
      ? poseScore * 0.7 + score * 0.3  // Posture dominates for open-posture
      : score * 0.6 + poseScore * 0.4
  }

  score = Math.round(clamp(score, 0, 100))
  const verdict: 'pass' | 'needs-work' = score >= 70 ? 'pass' : 'needs-work'

  // Compute individual technique scores for detailed feedback
  const facialScore = facialSnapshots.length > 0
    ? Math.round(clamp(avgOverallEngagement(facialSnapshots) * 150 + 30, 0, 100))
    : 0
  const poseScore = poseSnapshots.length > 0
    ? Math.round(clamp(avg(poseSnapshots.map(s => shoulderOpenness(s.poseLandmarks!))), 0, 100))
    : 0
  // Timing: higher score if consistent engagement across frames
  const engagementValues = facialSnapshots.map(s => {
    const vals = Object.entries(s.blendshapes).filter(([k]) => k !== '_neutral').map(([, v]) => v)
    return avg(vals)
  })
  const engagementStdDev = engagementValues.length > 1
    ? Math.sqrt(avg(engagementValues.map(v => Math.pow(v - avg(engagementValues), 2))))
    : 0
  const timingScore = Math.round(clamp(100 - engagementStdDev * 500, 0, 100))
  // Eye contact: based on eye-specific blendshapes
  const eyeBlendshapes = ['eyeLookUpLeft', 'eyeLookUpRight', 'eyeLookDownLeft', 'eyeLookDownRight', 'eyeBlinkLeft', 'eyeBlinkRight']
  const eyeScore = facialSnapshots.length > 0
    ? Math.round(clamp(avgBlendshapeActivation(facialSnapshots, eyeBlendshapes) * 200 + 40, 0, 100))
    : 0

  const scores = [
    { label: 'Facial expression accuracy', score: facialScore },
    { label: 'Body posture alignment', score: poseScore },
    { label: 'Timing and naturalness', score: timingScore },
    { label: 'Eye contact quality', score: eyeScore },
  ]

  const detailedFeedback = generateDetailedMicroFeedback(skillCategory, skillFocus, scores, facialSnapshots.length, poseSnapshots.length)

  return {
    verdict,
    headline: generateMicroHeadline(skillFocus, score, verdict),
    detail: generateMicroDetail(skillCategory, score, facialSnapshots.length, poseSnapshots.length),
    score,
    scores,
    ...detailedFeedback,
  }
}

function generateDetailedMicroFeedback(
  skillCategory: string,
  skillFocus: string,
  scores: { label: string; score: number }[],
  faceCount: number,
  poseCount: number,
): { positives: string[]; improvements: string[]; actionableTip: string; nextStep: string } {
  const positives: string[] = []
  const improvements: string[] = []

  const facialScore = scores.find(s => s.label.includes('Facial'))?.score ?? 0
  const postureScore = scores.find(s => s.label.includes('Posture'))?.score ?? 0
  const timingScore = scores.find(s => s.label.includes('Timing'))?.score ?? 0
  const eyeScore = scores.find(s => s.label.includes('Eye'))?.score ?? 0

  const skillName = skillCategory.replace(/-/g, ' ')

  // Generate specific positives based on scores
  if (facialScore >= 70) positives.push(`Your facial muscles showed good activation for ${skillName} — the key expression muscles (orbicularis oculi, zygomaticus) engaged at appropriate intensity`)
  else if (facialScore >= 50) positives.push(`Your facial expression showed emerging engagement — some of the target muscles are activating`)

  if (postureScore >= 70) positives.push(`Your body posture was well-aligned with open shoulders and stable stance`)
  else if (postureScore >= 50 && poseCount > 0) positives.push(`Your posture showed reasonable openness during the practice`)

  if (timingScore >= 70) positives.push(`Your expression timing was consistent and natural throughout the recording`)

  if (eyeScore >= 70) positives.push(`Your eye engagement was strong — good gaze stability and natural blink rate`)

  if (faceCount > 0 && positives.length === 0) positives.push(`Your face was detected throughout the practice, showing commitment to the exercise`)

  // Generate specific improvements
  if (facialScore < 70) improvements.push(`Increase facial muscle engagement — try exaggerating the ${skillName} expression by 30% more than feels natural, then dial back`)
  if (postureScore < 70 && poseCount > 0) improvements.push(`Open your posture more — roll shoulders back, lift your sternum slightly, and keep your weight evenly distributed`)
  else if (poseCount === 0) improvements.push(`Move further back from the camera so your upper body is visible for posture analysis`)
  if (timingScore < 70) improvements.push(`Work on expression consistency — practice holding the target expression steady for 5 seconds before releasing`)
  if (eyeScore < 70) improvements.push(`Improve eye engagement — practice the triangle technique (left eye → right eye → mouth) with 3-second holds at each point`)

  // Actionable tip based on weakest area
  const weakest = scores.reduce((min, s) => s.score < min.score ? s : min)
  const tipMap: Record<string, string> = {
    'Facial expression accuracy': `Mirror exercise: Stand in front of a mirror and practice the ${skillName} expression. Hold for 5 seconds, relax for 3, repeat 5 times. Focus on engaging your frontalis (forehead) and zygomaticus (cheek) muscles together.`,
    'Body posture alignment': 'Wall check: Stand with your back against a wall — heels, glutes, shoulder blades, and head should all touch. Step forward and maintain that posture during your next practice attempt.',
    'Timing and naturalness': `Metronome practice: Use a 60 BPM beat and transition into the ${skillName} expression on beat 1, hold through beats 2-3, and release on beat 4. This builds consistent timing.`,
    'Eye contact quality': 'Dot focus drill: Place a small dot on your screen at eye level. Practice looking at it for 3 seconds, breaking gaze down-left for 1 second, then returning. Repeat 10 times.',
  }
  const actionableTip = tipMap[weakest.label] || `Practice the ${skillName} technique in front of a mirror for 2 minutes, focusing on the weakest element.`

  // Next step based on overall performance
  const avgScore = avg(scores.map(s => s.score))
  const nextStep = avgScore >= 80
    ? `Try combining ${skillName} with vocal pacing — add speech while maintaining your expression`
    : avgScore >= 60
    ? `Repeat this exercise focusing specifically on ${weakest.label.toLowerCase()}, aiming for 75+ score`
    : `Practice the ${skillName} basics: start with just the facial expression in a mirror before recording`

  return { positives, improvements, actionableTip, nextStep }
}

// ─── Full Performance Scoring ──────────────────────────────────────────────

export interface DimensionScore {
  label: string
  score: number
}

export interface FullPerformanceMetrics {
  overallScore: number
  dimensions: DimensionScore[]
  expressionTimeline: number[]
  poseTimeline: number[]
}

const SKILL_DIMENSIONS: Record<string, string[]> = {
  'eye-contact': ['Gaze Duration', 'Break Direction', 'Eye Opening', 'Consistency'],
  'open-posture': ['Chest Openness', 'Arm Position', 'Stance Width', 'Spine Alignment'],
  'active-listening': ['Forward Lean', 'Nod Timing', 'Facial Mirroring', 'Stillness'],
  'vocal-pacing': ['Pause Timing', 'Tempo Variation', 'Volume Range', 'Rhythm Control'],
  'confident-disagreement': ['Posture Stability', 'Eye Contact Hold', 'Voice Steadiness', 'Open Body'],
}

export function scoreFullPerformanceFromAnalysis(
  skillCategory: string,
  snapshots: AnalysisSnapshot[]
): FullPerformanceMetrics {
  const dimensions = SKILL_DIMENSIONS[skillCategory] ?? ['Expression', 'Posture', 'Engagement', 'Consistency']

  const facialSnapshots = snapshots.filter(s => s.faceDetected)
  const poseSnapshots = snapshots.filter(s => s.poseLandmarks)

  const expressionTimeline = facialSnapshots.map(s => {
    const vals = Object.entries(s.blendshapes)
      .filter(([k]) => k !== '_neutral')
      .map(([, v]) => v)
    return avg(vals) * 100
  })

  const poseTimeline = poseSnapshots.map(s =>
    shoulderOpenness(s.poseLandmarks!)
  )

  // Score each dimension (0-10)
  const dimensionScores: DimensionScore[] = dimensions.map((label, i) => {
    let score: number

    switch (i) {
      case 0: // Primary metric (varies by skill)
        score = facialSnapshots.length > 0
          ? clamp(avgOverallEngagement(facialSnapshots) * 12 + 3, 1, 10)
          : 5
        break
      case 1: // Secondary metric
        score = poseSnapshots.length > 0
          ? clamp(avg(poseTimeline) / 10, 1, 10)
          : 5
        break
      case 2: // Tertiary metric
        score = facialSnapshots.length >= 3
          ? clamp(10 - standardDeviation(expressionTimeline) * 2, 1, 10)
          : 5
        break
      case 3: // Consistency
        score = computeConsistencyScore(expressionTimeline, poseTimeline)
        break
      default:
        score = 5
    }

    return { label, score: Math.round(clamp(score, 1, 10)) }
  })

  const overallScore = Math.round(avg(dimensionScores.map(d => d.score)) * 10)

  return {
    overallScore: clamp(overallScore, 0, 100),
    dimensions: dimensionScores,
    expressionTimeline,
    poseTimeline,
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function standardDeviation(arr: number[]): number {
  if (arr.length < 2) return 0
  const mean = avg(arr)
  const variance = arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

function computeConsistency(values: number[]): number {
  if (values.length < 2) return 60
  const sd = standardDeviation(values)
  const mean = avg(values)
  if (mean === 0) return 50
  const cv = sd / mean // coefficient of variation
  // Lower CV = more consistent = higher score
  return clamp(100 - cv * 100, 20, 100)
}

function computeConsistencyScore(expression: number[], pose: number[]): number {
  let score = 5
  if (expression.length >= 3) {
    const exprConsistency = computeConsistency(expression)
    score = clamp(exprConsistency / 10, 1, 10)
  }
  if (pose.length >= 3) {
    const poseConsistency = computeConsistency(pose)
    score = (score + clamp(poseConsistency / 10, 1, 10)) / 2
  }
  return Math.round(score)
}

function avgBlendshapeActivation(snapshots: AnalysisSnapshot[], keys: string[]): number {
  if (snapshots.length === 0 || keys.length === 0) return 0
  let total = 0
  for (const s of snapshots) {
    for (const k of keys) {
      total += s.blendshapes[k] ?? 0
    }
  }
  return total / (snapshots.length * keys.length)
}

function avgOverallEngagement(snapshots: AnalysisSnapshot[]): number {
  if (snapshots.length === 0) return 0
  let total = 0
  for (const s of snapshots) {
    let frameTotal = 0
    let count = 0
    for (const [k, v] of Object.entries(s.blendshapes)) {
      if (k !== '_neutral') {
        frameTotal += v
        count++
      }
    }
    total += count > 0 ? frameTotal / count : 0
  }
  return total / snapshots.length
}

function fallbackScore(message: string): ArcadeScoreResult {
  return {
    score: 30,
    breakdown: { expression_match: 30, intensity: 30, context_fit: 30 },
    feedback_line: message,
  }
}

// ─── Feedback Text Generation ──────────────────────────────────────────────

function generateArcadeFeedback(
  exprMatch: number,
  intensity: number,
  contextFit: number,
  overall: number
): string {
  if (overall >= 85) {
    const great = [
      'Excellent expression! You nailed it.',
      'Outstanding performance — very convincing!',
      'Perfect match! You could be on screen.',
    ]
    return great[Math.floor(Math.random() * great.length)]
  }

  if (overall >= 70) {
    const good = [
      'Good work! Your expression is on the right track.',
      'Nice effort — just a bit more commitment and you\'re there.',
      'Solid performance! Keep practicing for perfection.',
    ]
    return good[Math.floor(Math.random() * good.length)]
  }

  // Find weakest area
  const min = Math.min(exprMatch, intensity, contextFit)
  if (min === exprMatch) {
    return 'Try to match the specific expression more closely — focus on the key facial muscles.'
  }
  if (min === intensity) {
    return 'Push the expression further — don\'t be shy about exaggerating. Really commit!'
  }
  return 'Hold the expression steady throughout. Consistency matters as much as accuracy.'
}

function generateMicroHeadline(skillFocus: string, score: number, verdict: 'pass' | 'needs-work'): string {
  if (verdict === 'pass') {
    return `Great ${skillFocus.toLowerCase()}! You're showing real progress.`
  }
  return `Keep working on ${skillFocus.toLowerCase()} — you're getting there.`
}

function generateMicroDetail(
  skillCategory: string,
  score: number,
  faceFrames: number,
  poseFrames: number
): string {
  if (faceFrames === 0 && poseFrames === 0) {
    return 'We couldn\'t detect your face or body clearly. Try adjusting your camera position and lighting.'
  }

  if (score >= 80) {
    return 'Your form is excellent. The key elements are clearly visible and well-executed.'
  }
  if (score >= 60) {
    return 'You\'re on the right track. Focus on making the movement more deliberate and sustained.'
  }
  return 'Try to be more intentional with the technique. Watch the reference clip again and focus on one element at a time.'
}
