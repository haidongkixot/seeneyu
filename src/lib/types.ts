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
  script: string | null
  observationGuide: ObservationGuide | null
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

export interface ObservationMoment {
  atSecond: number
  technique: string
  what: string
  why: string
}

export interface ObservationGuide {
  moments: ObservationMoment[]
  headline: string
}

export interface ActionPlanStep {
  number: number
  action: string
  why: string
}

export interface FeedbackResult {
  overallScore: number          // 0–100
  summary: string
  dimensions: FeedbackDimension[]
  positives: string[]
  improvements: string[]
  steps: ActionPlanStep[]
  tips: FeedbackTip[]
  nextClipId?: string
  modelUsed: string
  processingMs: number
}

export interface PracticeStep {
  id: string
  clipId: string
  stepNumber: number
  skillFocus: string
  instruction: string
  tip: string | null
  targetDurationSec: number
}

export interface MicroFeedback {
  verdict: 'pass' | 'needs-work'
  headline: string
  detail: string
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

export interface SkillBaseline {
  id: string
  userId: string
  skillCategory: SkillCategory
  level: SkillLevel
  selfRating: SkillLevel
  createdAt: string
}

export interface SkillTrackNextClip {
  id: string
  title: string
  thumbnailUrl: string
  difficulty: Difficulty
  skillCategory: SkillCategory
}

export interface SkillTrack {
  skillCategory: SkillCategory
  currentLevel: SkillLevel
  clipsCompleted: number
  clipsTotal: number
  nextClip: SkillTrackNextClip | null
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

export interface FoundationCourse {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  color: string
  order: number
  lessons?: FoundationLesson[]
  _count?: { lessons: number }
}

export interface FoundationLesson {
  id: string
  courseId: string
  slug: string
  title: string
  theoryHtml: string
  order: number
  examples?: LessonExample[]
  questions?: QuizQuestion[]
}

export interface LessonExample {
  id: string
  youtubeId: string
  title: string
  description: string
  startTime?: number | null
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  order: number
}

export type CrawlJobStatus = 'pending' | 'running' | 'complete' | 'failed'
export type CrawlResultStatus = 'pending' | 'approved' | 'rejected'

export interface CrawlJob {
  id: string
  name: string
  skillCategory: string
  technique: string | null
  keywords: string[]
  difficulty: string | null
  maxResults: number
  status: CrawlJobStatus
  errorMessage: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  results?: CrawlResult[]
  _count?: { results: number }
}

export interface CrawlResult {
  id: string
  jobId: string
  youtubeId: string
  title: string
  channelName: string
  thumbnailUrl: string
  description: string
  durationSec: number | null
  publishedAt: string | null
  viewCount: number | null
  relevanceScore: number
  aiAnalysis: string | null
  status: CrawlResultStatus
  approvedClipId: string | null
  createdAt: string
}

export interface FoundationProgress {
  lessonId: string
  quizScore?: number | null
  quizPassed: boolean
  completedAt?: Date | null
}

// ── Arcade types ────────────────────────────────────────────────────

export interface ArcadeBundle {
  id: string
  title: string
  description: string
  theme: string
  difficulty: string
  xpReward: number
  createdAt: string
  challenges?: ArcadeChallenge[]
  _count?: { challenges: number }
}

export interface ArcadeChallenge {
  id: string
  bundleId: string
  type: 'facial' | 'gesture'
  title: string
  description: string
  context: string
  referenceImageUrl: string | null
  sourceClipId: string | null
  sourceTimestamp: number | null
  difficulty: string
  xpReward: number
  orderIndex: number
}

export interface ArcadeAttempt {
  id: string
  userId: string
  challengeId: string
  score: number
  breakdown: {
    expression_match: number
    intensity: number
    context_fit: number
  }
  feedbackLine: string | null
  recordingUrl: string | null
  createdAt: string
}
