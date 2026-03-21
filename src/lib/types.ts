export type SkillCategory =
  | 'eye-contact'
  | 'open-posture'
  | 'active-listening'
  | 'vocal-pacing'
  | 'confident-disagreement'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type AnnotationType = 'eye_contact' | 'posture' | 'gesture' | 'voice' | 'expression'

export interface ClipAnnotation {
  id: string
  clipId: string
  atSecond: number
  note: string
  type: AnnotationType
}

export interface Clip {
  id: string
  youtubeVideoId: string
  startSec: number
  endSec: number
  movieTitle: string
  year: number | null
  characterName: string | null
  actorName: string | null
  sceneDescription: string
  skillCategory: SkillCategory
  difficulty: Difficulty
  difficultyScore: number
  signalClarity: number
  noiseLevel: number
  contextDependency: number
  replicationDifficulty: number
  annotation: string
  contextNote: string | null
  isActive: boolean
  annotations: ClipAnnotation[]
}

export interface FeedbackDimension {
  label: string
  score: number  // 0–10
}

export interface FeedbackTip {
  title: string
  body: string
  exerciseLink?: string
}

export interface FeedbackResult {
  overallScore: number          // 0–100
  summary: string
  dimensions: FeedbackDimension[]
  positives: string[]
  improvements: string[]
  tips: FeedbackTip[]
  nextClipId?: string
  modelUsed: string
  processingMs: number
}

export interface UserSession {
  id: string
  clipId: string
  recordingUrl: string | null
  status: string
  feedback: FeedbackResult | null
  scores: { overallScore: number; dimensions: FeedbackDimension[] } | null
  createdAt: string
  completedAt: string | null
}

export const SKILL_LABELS: Record<SkillCategory, string> = {
  'eye-contact':            'Eye Contact',
  'open-posture':           'Open Posture',
  'active-listening':       'Active Listening',
  'vocal-pacing':           'Vocal Pacing',
  'confident-disagreement': 'Confident Disagreement',
}

export const SKILL_COLORS: Record<SkillCategory, { text: string; bg: string; border: string }> = {
  'eye-contact':            { text: '#c4b5fd', bg: '#2e1065', border: '#7c3aed' },
  'open-posture':           { text: '#67e8f9', bg: '#083344', border: '#0891b2' },
  'active-listening':       { text: '#6ee7b7', bg: '#052e16', border: '#059669' },
  'vocal-pacing':           { text: '#fde68a', bg: '#451a03', border: '#d97706' },
  'confident-disagreement': { text: '#fca5a5', bg: '#450a0a', border: '#dc2626' },
}

export const DIFFICULTY_COLORS: Record<Difficulty, { text: string; bg: string; border: string }> = {
  beginner:     { text: '#86efac', bg: '#052e16', border: '#16a34a' },
  intermediate: { text: '#fde68a', bg: '#451a03', border: '#ca8a04' },
  advanced:     { text: '#fca5a5', bg: '#450a0a', border: '#dc2626' },
}
