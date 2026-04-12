/**
 * Practice Ideating Generator
 *
 * Two-phase pipeline:
 *  1. Generate a lightweight catalog (titles, characters, skill/difficulty/style mapping)
 *  2. For each catalog entry, generate the full practice idea with main video prompt +
 *     observation guide + practice steps with per-step video + image prompts
 *
 * Output matches the shape of scripts/data/ai-practices-batch-01.json.
 */

import OpenAI from 'openai'

// ── Types ────────────────────────────────────────────────────────────

export interface IdeatingConfig {
  totalCount: number
  skills: Record<string, number>           // e.g. { 'eye-contact': 4, 'facial-expressions': 4, ... }
  difficultyMix: {                         // percentages 0-100 summing to 100
    beginner: number
    intermediate: number
    advanced: number
  }
  stylePixarRatio: number                  // 0-100 — percent of ideas in Pixar-3D (rest in realistic)
  tone: string                             // e.g. 'positive, humor'
  language: string                         // e.g. 'English'
  characterTheme: 'mixed' | 'animals' | 'humans'
  pmPrompt: string                         // freeform notes from the PM
}

export interface CatalogEntry {
  title: string
  skillCategory: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  filmingStyle: 'pixar-3d' | 'realistic'
  characterName: string
  voiceLine: string | null                 // exact line the character speaks, or null
}

export interface ObservationMoment {
  atSecond: number
  technique: string
  what: string
  why: string
}

export interface PracticeStep {
  stepNumber: number
  skillFocus: string
  instruction: string
  tip: string
  targetDurationSec: number
  videoPrompt: string
  imagePrompt: string
}

export interface PracticeIdea {
  id: string
  title: string
  skillCategory: string
  difficulty: string
  characterName: string
  characterDescription: string
  sceneDescription: string
  annotation: string
  filmingStyle: string
  tone: string
  mediaType: 'ai_video'
  estimatedDurationSec: number
  mainVideo: {
    durationSec: number
    aspectRatio: string
    prompt: string
  }
  observationGuide: {
    headline: string
    moments: ObservationMoment[]
  }
  practiceSteps: PracticeStep[]
}

// ── OpenAI client ────────────────────────────────────────────────────

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY missing')
  return new OpenAI({ apiKey: key })
}

const MODEL = 'gpt-4o-mini'

// ── Phase 1: Catalog generation ──────────────────────────────────────

const CATALOG_SYSTEM_PROMPT = `You are a senior curriculum designer for seeneyu, a body language and communication coaching app.
Your job: produce a catalog of practice ideas for a new batch. Each idea will later be expanded into a full video-based practice with a main video, observation guide, and practice steps.

Rules:
- Every practice idea must teach ONE observable body language or facial expression technique.
- Ideas must be specific (verb-led scenes), NOT generic descriptions.
- Respect the skill distribution and difficulty mix provided in the user message.
- Use the filming style distribution provided (Pixar-3D cartoon in the style of Kung Fu Panda / Coco / Madagascar, OR realistic cinematic short film with warm naturalism).
- Character names should match the theme (animals for Pixar, humans for realistic). Make them unique and memorable.
- Voice lines must be short, natural, matching the tone, and in the requested language. Use null when no speech.
- Evidence-grounded: prefer techniques with strong research backing (Video Self-Modeling, deliberate practice, embodied cognition, mirror neurons).

Return STRICT JSON with shape: { "catalog": CatalogEntry[] }`

export async function generateCatalog(config: IdeatingConfig): Promise<CatalogEntry[]> {
  const openai = getOpenAI()

  const skillList = Object.entries(config.skills)
    .map(([skill, count]) => `  - ${skill}: ${count} ideas`)
    .join('\n')

  const userPrompt = `Generate a catalog of EXACTLY ${config.totalCount} practice ideas for this batch.

## Skill distribution (exact counts)
${skillList}

## Difficulty mix (approximate percentages, distribute per skill)
- beginner: ${config.difficultyMix.beginner}%
- intermediate: ${config.difficultyMix.intermediate}%
- advanced: ${config.difficultyMix.advanced}%

## Filming style
- pixar-3d: ${config.stylePixarRatio}% of ideas (use Kung Fu Panda for action/strong characters, Coco for warm/intimate moments, Madagascar for humor/playful scenes)
- realistic: ${100 - config.stylePixarRatio}% of ideas (cinematic short film with warm naturalism, human characters)

## Character theme
${config.characterTheme} (${config.characterTheme === 'mixed' ? 'animals for Pixar, humans for realistic' : config.characterTheme === 'animals' ? 'animals throughout, even in realistic (claymation vibe)' : 'humans throughout'})

## Tone
${config.tone}

## Language
${config.language}

## PM notes
${config.pmPrompt || '(none)'}

Return JSON with this exact shape:
{
  "catalog": [
    {
      "title": "Short memorable name (3-5 words)",
      "skillCategory": "one of: eye-contact, open-posture, active-listening, vocal-pacing, confident-disagreement, facial-expressions",
      "difficulty": "beginner | intermediate | advanced",
      "filmingStyle": "pixar-3d | realistic",
      "characterName": "First name only (e.g. Maple, Bruno, Sara)",
      "voiceLine": "Exact line the character speaks, or null if no speech"
    }
  ]
}

Produce EXACTLY ${config.totalCount} entries with the skill counts matching the distribution above.`

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: CATALOG_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4000,
    temperature: 0.9,
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw)
  const catalog = parsed.catalog as CatalogEntry[]
  if (!Array.isArray(catalog)) throw new Error('GPT returned invalid catalog shape')
  return catalog
}

// ── Phase 2: Full idea generation ────────────────────────────────────

const IDEA_SYSTEM_PROMPT = `You are a senior prompt engineer for seeneyu's AI video pipeline.
Given a lightweight catalog entry, produce a complete practice idea with full video prompts, observation guide, and practice steps.

Quality bar:
- Main video prompt is 80-150 words using a 3-beat structure (Beat 1: 0-5s, Beat 2: 5-10s, Beat 3: 10-15s) with explicit timestamps.
- Every main video prompt must specify: STYLE (Pixar 3D with reference film OR realistic cinematic), CHARACTER description, SETTING (lighting + palette), ACTION (3 beats), SPEECH (exact line OR none), AUDIO (music + SFX), CAMERA (framing + movement).
- Observation guide has 4 timestamped moments with technique + what + why (evidence-grounded).
- Practice steps are 4 items, each with instruction (starts with a verb, 2-3 sentences), tip (1 sentence), targetDurationSec (10-30s), videoPrompt (30-60 words for a 5-second tight shot), imagePrompt (20-40 words, minimalist sketch style, white background, no text).
- All text in the requested language.

Return STRICT JSON matching the PracticeIdea schema.`

export async function generateFullIdea(
  catalogEntry: CatalogEntry,
  index: number,
  config: IdeatingConfig,
): Promise<PracticeIdea> {
  const openai = getOpenAI()

  const pixarRef = catalogEntry.filmingStyle === 'pixar-3d'
    ? 'Pixar-style 3D animation in the visual tone of Kung Fu Panda / Coco / Madagascar — pick the best fit for the scene'
    : 'Realistic cinematic short film with warm naturalism and soft natural lighting'

  const userPrompt = `Generate a full practice idea for this catalog entry:

- title: ${catalogEntry.title}
- skillCategory: ${catalogEntry.skillCategory}
- difficulty: ${catalogEntry.difficulty}
- filmingStyle: ${catalogEntry.filmingStyle}
- characterName: ${catalogEntry.characterName}
- voiceLine: ${catalogEntry.voiceLine ?? '(none — no speech)'}

## Filming style guidance
${pixarRef}

## Tone
${config.tone}

## Language
${config.language}

## PM context
${config.pmPrompt || '(none)'}

Return JSON with this exact shape:
{
  "characterDescription": "1-sentence physical description",
  "sceneDescription": "1-2 verb-led sentences describing the scene",
  "annotation": "2-3 sentence coaching note explaining what to notice + why",
  "mainVideo": {
    "prompt": "80-150 word video prompt with 3-beat structure (Beat 1: 0-5s: ..., Beat 2: 5-10s: ..., Beat 3: 10-15s: ...) including style, character, setting, action, speech (use exact voice line if provided), audio, camera"
  },
  "observationGuide": {
    "headline": "How [character] [does something] — short catchy title",
    "moments": [
      { "atSecond": <int 0-15>, "technique": "3-5 word name", "what": "1 sentence visible behavior", "why": "1 sentence reason" }
    ]
  },
  "practiceSteps": [
    {
      "stepNumber": 1,
      "skillFocus": "3-5 word technique name",
      "instruction": "2-3 sentences starting with a verb (Stand..., Lock..., Count...)",
      "tip": "1 sentence practical pro tip",
      "targetDurationSec": <int 10-30>,
      "videoPrompt": "30-60 word prompt for a 5-second tight shot of the single technique",
      "imagePrompt": "20-40 word minimalist sketch prompt with white background, no text"
    }
  ]
}

Generate exactly 4 observation moments and exactly 4 practice steps.`

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: IDEA_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2500,
    temperature: 0.8,
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw)

  // Assemble the full PracticeIdea
  const idx = String(index + 1).padStart(3, '0')
  return {
    id: `ai-practice-${idx}`,
    title: catalogEntry.title,
    skillCategory: catalogEntry.skillCategory,
    difficulty: catalogEntry.difficulty,
    characterName: catalogEntry.characterName,
    characterDescription: String(parsed.characterDescription ?? ''),
    sceneDescription: String(parsed.sceneDescription ?? ''),
    annotation: String(parsed.annotation ?? ''),
    filmingStyle: catalogEntry.filmingStyle,
    tone: config.tone,
    mediaType: 'ai_video',
    estimatedDurationSec: 15,
    mainVideo: {
      durationSec: 15,
      aspectRatio: '16:9',
      prompt: String(parsed.mainVideo?.prompt ?? ''),
    },
    observationGuide: {
      headline: String(parsed.observationGuide?.headline ?? ''),
      moments: Array.isArray(parsed.observationGuide?.moments)
        ? parsed.observationGuide.moments.map((m: any) => ({
            atSecond: Number(m.atSecond) || 0,
            technique: String(m.technique ?? ''),
            what: String(m.what ?? ''),
            why: String(m.why ?? ''),
          }))
        : [],
    },
    practiceSteps: Array.isArray(parsed.practiceSteps)
      ? parsed.practiceSteps.map((s: any, i: number) => ({
          stepNumber: Number(s.stepNumber) || i + 1,
          skillFocus: String(s.skillFocus ?? ''),
          instruction: String(s.instruction ?? ''),
          tip: String(s.tip ?? ''),
          targetDurationSec: Number(s.targetDurationSec) || 20,
          videoPrompt: String(s.videoPrompt ?? ''),
          imagePrompt: String(s.imagePrompt ?? ''),
        }))
      : [],
  }
}

// ── Full batch orchestration ─────────────────────────────────────────

export interface GenerateBatchOptions {
  config: IdeatingConfig
  onProgress?: (completed: number, total: number, message: string) => void
}

export async function generatePracticeIdeaBatch({ config, onProgress }: GenerateBatchOptions): Promise<PracticeIdea[]> {
  onProgress?.(0, config.totalCount, 'Generating catalog...')
  const catalog = await generateCatalog(config)

  if (catalog.length === 0) throw new Error('Catalog generation returned empty')
  if (catalog.length !== config.totalCount) {
    console.warn(`[practice-ideating] expected ${config.totalCount} catalog entries, got ${catalog.length}`)
  }

  onProgress?.(0, catalog.length, 'Expanding ideas in parallel...')

  // Generate all full ideas in parallel — each idea is independent
  const ideaPromises = catalog.map((entry, i) =>
    generateFullIdea(entry, i, config)
      .then((idea) => {
        onProgress?.(i + 1, catalog.length, `Completed: ${idea.title}`)
        return idea
      })
      .catch((err) => {
        console.error(`[practice-ideating] failed idea ${i + 1}: ${entry.title}`, err?.message)
        // Return a stub so the batch doesn't fail entirely
        return {
          id: `ai-practice-${String(i + 1).padStart(3, '0')}`,
          title: entry.title,
          skillCategory: entry.skillCategory,
          difficulty: entry.difficulty,
          characterName: entry.characterName,
          characterDescription: '',
          sceneDescription: '(generation failed)',
          annotation: `Error: ${err?.message || 'unknown'}`,
          filmingStyle: entry.filmingStyle,
          tone: config.tone,
          mediaType: 'ai_video' as const,
          estimatedDurationSec: 15,
          mainVideo: { durationSec: 15, aspectRatio: '16:9', prompt: '' },
          observationGuide: { headline: '', moments: [] },
          practiceSteps: [],
        }
      }),
  )

  const ideas = await Promise.all(ideaPromises)
  return ideas
}

// ── Markdown export ──────────────────────────────────────────────────

export function ideasToMarkdown(batchName: string, ideas: PracticeIdea[]): string {
  const lines: string[] = []
  lines.push(`# ${batchName}`)
  lines.push('')
  lines.push(`${ideas.length} practice ideas generated via seeneyu Practice Ideating toolkit.`)
  lines.push('')
  lines.push('| # | Title | Skill | Difficulty | Style | Character |')
  lines.push('|---|---|---|---|---|---|')
  ideas.forEach((p, i) => {
    lines.push(`| ${i + 1} | ${p.title} | ${p.skillCategory} | ${p.difficulty} | ${p.filmingStyle} | ${p.characterName} |`)
  })
  lines.push('')
  lines.push('---')
  lines.push('')

  ideas.forEach((p, i) => {
    lines.push(`## Practice ${i + 1}: ${p.title}`)
    lines.push(`**Skill**: ${p.skillCategory} | **Difficulty**: ${p.difficulty} | **Style**: ${p.filmingStyle} | **Character**: ${p.characterName}`)
    lines.push('')
    lines.push(`**Character**: ${p.characterDescription}`)
    lines.push('')
    lines.push(`**Scene**: ${p.sceneDescription}`)
    lines.push('')
    lines.push(`**Coaching note**: ${p.annotation}`)
    lines.push('')
    lines.push(`### Main Video (${p.mainVideo.durationSec}s)`)
    lines.push('> ' + p.mainVideo.prompt.replace(/\n/g, '\n> '))
    lines.push('')
    lines.push(`### Observation Guide — ${p.observationGuide.headline}`)
    p.observationGuide.moments.forEach((m) => {
      lines.push(`- **${m.atSecond}s** — *${m.technique}*: ${m.what} (${m.why})`)
    })
    lines.push('')
    lines.push('### Practice Steps')
    p.practiceSteps.forEach((s) => {
      lines.push(`**Step ${s.stepNumber}: ${s.skillFocus}** (${s.targetDurationSec}s)`)
      lines.push(`- **Instruction**: ${s.instruction}`)
      lines.push(`- 💡 **Tip**: ${s.tip}`)
      lines.push(`- 🎬 **Video prompt (5s)**: ${s.videoPrompt}`)
      lines.push(`- 🖼  **Image prompt**: ${s.imagePrompt}`)
      lines.push('')
    })
    lines.push('---')
    lines.push('')
  })

  return lines.join('\n')
}
