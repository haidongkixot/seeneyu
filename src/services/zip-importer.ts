/**
 * ZIP Importer — processes a ZIP file containing lesson/clip data for bulk import.
 *
 * Expected ZIP structure:
 *   metadata.json          ← required: describes the content
 *   screenplay.txt         ← optional: screenplay text for a clip
 *   practice-steps.json    ← optional: practice steps array
 *
 * metadata.json schema:
 * {
 *   "type": "clip" | "lesson",
 *   "clip": { ... clip fields matching Prisma Clip model ... },
 *   "annotations": [ { at_second, type, note } ],
 *   "observation_guide": { ... },
 * }
 */

import JSZip from 'jszip'
import { prisma } from '@/lib/prisma'

export interface ImportResult {
  success: boolean
  type: string
  id?: string
  title?: string
  error?: string
  details?: string[]
}

interface ClipMetadata {
  type: 'clip'
  clip: {
    youtubeVideoId: string
    movieTitle: string
    characterName?: string
    actorName?: string
    year?: number
    sceneDescription: string
    skillCategory: string
    difficulty: string
    difficultyScore?: number
    signalClarity?: number
    noiseLevel?: number
    contextDependency?: number
    replicationDifficulty?: number
    annotation?: string
    contextNote?: string
    script?: string
    screenplaySource?: string
    startSec: number
    endSec: number
  }
  annotations?: { at_second: number; type: string; note: string }[]
  observation_guide?: Record<string, unknown>
}

interface PracticeStep {
  step_number: number
  skill_focus: string
  instruction: string
  tip?: string
  target_duration_sec: number
}

export async function importZip(buffer: ArrayBuffer): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(buffer)
  const details: string[] = []

  // Find metadata.json
  const metaFile = zip.file('metadata.json')
  if (!metaFile) {
    return { success: false, type: 'unknown', error: 'metadata.json not found in ZIP' }
  }

  let metadata: ClipMetadata
  try {
    const metaText = await metaFile.async('string')
    metadata = JSON.parse(metaText)
  } catch {
    return { success: false, type: 'unknown', error: 'Failed to parse metadata.json' }
  }

  if (metadata.type !== 'clip') {
    return { success: false, type: metadata.type, error: `Unsupported import type: ${metadata.type}. Only "clip" is currently supported.` }
  }

  const clipData = metadata.clip
  if (!clipData?.youtubeVideoId || !clipData?.movieTitle || !clipData?.sceneDescription) {
    return { success: false, type: 'clip', error: 'metadata.json missing required clip fields (youtubeVideoId, movieTitle, sceneDescription)' }
  }

  // Check for duplicate
  const existing = await prisma.clip.findFirst({
    where: { youtubeVideoId: clipData.youtubeVideoId },
  })
  if (existing) {
    return { success: false, type: 'clip', error: `Clip with youtubeVideoId "${clipData.youtubeVideoId}" already exists (id: ${existing.id})` }
  }

  // Read optional screenplay text
  let screenplayText: string | undefined
  const screenplayFile = zip.file('screenplay.txt')
  if (screenplayFile) {
    screenplayText = await screenplayFile.async('string')
    details.push(`Screenplay: ${screenplayText.length.toLocaleString()} chars`)
  }

  // Read optional practice steps
  let practiceSteps: PracticeStep[] = []
  const stepsFile = zip.file('practice-steps.json')
  if (stepsFile) {
    try {
      const stepsText = await stepsFile.async('string')
      practiceSteps = JSON.parse(stepsText)
      details.push(`Practice steps: ${practiceSteps.length}`)
    } catch {
      details.push('Warning: practice-steps.json parse failed, skipped')
    }
  }

  // Create the clip
  const clip = await prisma.clip.create({
    data: {
      youtubeVideoId: clipData.youtubeVideoId,
      movieTitle: clipData.movieTitle,
      characterName: clipData.characterName ?? null,
      actorName: clipData.actorName ?? null,
      year: clipData.year ?? null,
      sceneDescription: clipData.sceneDescription,
      skillCategory: clipData.skillCategory ?? 'eye-contact',
      difficulty: clipData.difficulty ?? 'Beginner',
      difficultyScore: clipData.difficultyScore ?? 5,
      signalClarity: clipData.signalClarity ?? 5,
      noiseLevel: clipData.noiseLevel ?? 5,
      contextDependency: clipData.contextDependency ?? 5,
      replicationDifficulty: clipData.replicationDifficulty ?? 5,
      annotation: clipData.annotation ?? '',
      contextNote: clipData.contextNote ?? null,
      script: clipData.script ?? null,
      screenplaySource: clipData.screenplaySource ?? null,
      startSec: clipData.startSec,
      endSec: clipData.endSec,
      ...(screenplayText ? { screenplayText } : {}),
      ...(metadata.observation_guide ? { observationGuide: JSON.parse(JSON.stringify(metadata.observation_guide)) } : {}),
      annotations: metadata.annotations?.length ? {
        create: metadata.annotations.map(a => ({
          atSecond: a.at_second,
          type: a.type,
          note: a.note,
        })),
      } : undefined,
      practiceSteps: practiceSteps.length > 0 ? {
        create: practiceSteps.map(s => ({
          stepNumber: s.step_number,
          skillFocus: s.skill_focus,
          instruction: s.instruction,
          tip: s.tip ?? null,
          targetDurationSec: s.target_duration_sec,
        })),
      } : undefined,
    } as any,
  })

  details.push(`Clip created: ${clip.id}`)
  if (metadata.annotations?.length) {
    details.push(`Annotations: ${metadata.annotations.length}`)
  }

  return {
    success: true,
    type: 'clip',
    id: clip.id,
    title: `${clipData.movieTitle} — ${clipData.sceneDescription.substring(0, 60)}`,
    details,
  }
}
