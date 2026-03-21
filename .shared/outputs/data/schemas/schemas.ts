/**
 * seeneyu — Data Pipeline Zod Schemas
 * All pipeline outputs must be validated against these schemas before writing.
 * Maintained by: Data Engineer
 */

import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const SkillCategory = z.enum([
  "eye-contact",
  "open-posture",
  "active-listening",
  "vocal-pacing",
  "confident-disagreement",
]);

export const Difficulty = z.enum(["beginner", "intermediate", "advanced"]);

export const PipelineStatus = z.enum([
  "in-progress",
  "complete",
  "failed",
  "skipped",
]);

// ─── Raw Clip Candidate (YouTube search result) ───────────────────────────────

export const RawClipCandidateSchema = z.object({
  youtube_video_id: z.string().min(11).max(11),
  title: z.string().min(1),
  channel: z.string().min(1),
  duration_seconds: z.number().int().min(1),
  view_count: z.number().int().min(0),
  published_at: z.string(), // ISO date string
  search_query: z.string().min(1),
  candidate_skill: SkillCategory,
  status: z.enum(["candidate", "approved", "rejected"]),
});

export type RawClipCandidate = z.infer<typeof RawClipCandidateSchema>;

// ─── Screenplay Action Line ────────────────────────────────────────────────────

export const ScreenplayActionSchema = z.object({
  movie: z.string().min(1),
  scene_number: z.number().int().min(1),
  page: z.number().int().min(1),
  action_line: z.string().min(1),
  keywords_matched: z.array(z.string()),
  candidate_skill: SkillCategory,
  raw_text: z.string().min(1),
});

export type ScreenplayAction = z.infer<typeof ScreenplayActionSchema>;

// ─── Clip Annotation (AI-generated) ──────────────────────────────────────────

export const ClipAnnotationSchema = z.object({
  youtube_video_id: z.string().min(11).max(11),
  annotation: z.string().min(20),
  watch_for: z.string().min(10),
  skill_demonstrated: SkillCategory,
});

export type ClipAnnotation = z.infer<typeof ClipAnnotationSchema>;

// ─── Seed Clip (final curated — matches Prisma schema) ───────────────────────

export const SeedClipSchema = z.object({
  youtube_video_id: z.string().min(11).max(11),
  title: z.string().min(1),
  movie_title: z.string().min(1),
  character_name: z.string().optional(),
  skill_category: SkillCategory,
  difficulty: Difficulty,
  start_sec: z.number().int().min(0),
  end_sec: z.number().int().min(1),
  annotation: z.string().min(20),
  watch_for: z.string().min(10),
  context_note: z.string().optional(),
  // Difficulty scoring dimensions (1–3 each, sum = raw score)
  signal_clarity: z.number().int().min(1).max(3),    // 1=obvious, 3=subtle
  noise_level: z.number().int().min(1).max(3),        // 1=clean, 3=chaotic
  context_dependency: z.number().int().min(1).max(3), // 1=universal, 3=needs backstory
  replication_difficulty: z.number().int().min(1).max(3), // 1=easy, 3=hard
  // Computed: sum 4–5=beginner, 6–8=intermediate, 9–12=advanced
  difficulty_score: z.number().int().min(4).max(12),
});

export type SeedClip = z.infer<typeof SeedClipSchema>;

// ─── Clip Candidate (input to discovery pipeline) ─────────────────────────────

export const ClipCandidateInputSchema = z.object({
  id: z.string().min(1),
  movie_title: z.string().min(1),
  character_name: z.string().optional(),
  scene_description: z.string().min(10),
  target_skill: SkillCategory,
  target_difficulty: Difficulty,
  search_queries: z.array(z.string().min(1)).min(1),
  youtube_video_id: z.string().optional(), // filled by discovery pipeline
  start_sec: z.number().int().min(0).optional(),
  end_sec: z.number().int().min(1).optional(),
  signal_clarity: z.number().int().min(1).max(3),
  noise_level: z.number().int().min(1).max(3),
  context_dependency: z.number().int().min(1).max(3),
  replication_difficulty: z.number().int().min(1).max(3),
  difficulty_score: z.number().int().min(4).max(12),
  context_note: z.string().optional(),
  status: z.enum(["pending", "found", "annotated", "seeded", "rejected"]),
});

export type ClipCandidateInput = z.infer<typeof ClipCandidateInputSchema>;

// ─── Pipeline Checkpoint ──────────────────────────────────────────────────────

export const PipelineCheckpointSchema = z.object({
  pipeline: z.string().min(1),
  status: PipelineStatus,
  last_processed: z.string().nullable(),
  total_items: z.number().int().min(0),
  completed_items: z.number().int().min(0),
  output_file: z.string().min(1),
  errors: z.array(
    z.object({
      item_id: z.string(),
      error: z.string(),
      timestamp: z.string(),
    })
  ),
  started_at: z.string(),
  updated_at: z.string(),
});

export type PipelineCheckpoint = z.infer<typeof PipelineCheckpointSchema>;
