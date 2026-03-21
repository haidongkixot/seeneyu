/**
 * Pipeline Step 3: Curate Final Seed Data
 *
 * Reads: clips-raw.json + clip-candidates.json + clip-annotations.json
 * Writes: seed-clips.json (matches Prisma Clip model exactly)
 * Checkpoint: .shared/outputs/data/checkpoints/clip-curate.json
 *
 * Merges the three sources into final seed-clips.json.
 * Validates every clip against SeedClipSchema (Zod).
 * Skips clips missing youtube_video_id or annotation.
 *
 * Run: npm run curate
 */

import fs from "fs";
import path from "path";
import { z } from "zod";

const SHARED = path.resolve("../../../.shared/outputs/data");
const RAW_FILE = path.join(SHARED, "clips-raw.json");
const CANDIDATES_FILE = path.join(SHARED, "clip-candidates.json");
const ANNOTATIONS_FILE = path.join(SHARED, "clip-annotations.json");
const OUTPUT_FILE = path.join(SHARED, "seed-clips.json");

// Inline schema (mirrors schemas.ts to avoid import complexity)
const SkillCategory = z.enum([
  "eye-contact",
  "open-posture",
  "active-listening",
  "vocal-pacing",
  "confident-disagreement",
]);
const Difficulty = z.enum(["beginner", "intermediate", "advanced"]);

const SeedClipSchema = z.object({
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
  signal_clarity: z.number().int().min(1).max(3),
  noise_level: z.number().int().min(1).max(3),
  context_dependency: z.number().int().min(1).max(3),
  replication_difficulty: z.number().int().min(1).max(3),
  difficulty_score: z.number().int().min(4).max(12),
});

type SeedClip = z.infer<typeof SeedClipSchema>;

function scoreToDifficulty(score: number): "beginner" | "intermediate" | "advanced" {
  if (score <= 5) return "beginner";
  if (score <= 8) return "intermediate";
  return "advanced";
}

function run() {
  const rawClips = JSON.parse(fs.readFileSync(RAW_FILE, "utf-8")) as Array<{
    youtube_video_id: string;
    title: string;
    candidate_id: string;
  }>;

  const candidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf-8")) as Array<{
    id: string;
    movie_title: string;
    character_name?: string;
    target_skill: string;
    target_difficulty: string;
    start_sec: number | null;
    end_sec: number | null;
    signal_clarity: number;
    noise_level: number;
    context_dependency: number;
    replication_difficulty: number;
    difficulty_score: number;
    context_note?: string;
    status: string;
  }>;

  const annotations = JSON.parse(fs.readFileSync(ANNOTATIONS_FILE, "utf-8")) as Array<{
    youtube_video_id: string;
    candidate_id: string;
    annotation: string;
    watch_for: string;
  }>;

  const seedClips: SeedClip[] = [];
  const errors: string[] = [];

  for (const candidate of candidates) {
    const raw = rawClips.find((r) => r.candidate_id === candidate.id);
    const annotation = annotations.find((a) => a.candidate_id === candidate.id);

    if (!raw) {
      console.warn(`SKIP ${candidate.id}: no YouTube match found`);
      errors.push(`${candidate.id}: missing youtube match`);
      continue;
    }
    if (!annotation) {
      console.warn(`SKIP ${candidate.id}: no annotation`);
      errors.push(`${candidate.id}: missing annotation`);
      continue;
    }
    if (!candidate.start_sec || !candidate.end_sec) {
      console.warn(`SKIP ${candidate.id}: missing start_sec/end_sec — manual review needed`);
      errors.push(`${candidate.id}: missing timestamps`);
      continue;
    }

    const computed_score =
      candidate.signal_clarity +
      candidate.noise_level +
      candidate.context_dependency +
      candidate.replication_difficulty;

    const clip = {
      youtube_video_id: raw.youtube_video_id,
      title: raw.title,
      movie_title: candidate.movie_title,
      character_name: candidate.character_name,
      skill_category: candidate.target_skill as SeedClip["skill_category"],
      difficulty: scoreToDifficulty(computed_score),
      start_sec: candidate.start_sec,
      end_sec: candidate.end_sec,
      annotation: annotation.annotation,
      watch_for: annotation.watch_for,
      context_note: candidate.context_note,
      signal_clarity: candidate.signal_clarity,
      noise_level: candidate.noise_level,
      context_dependency: candidate.context_dependency,
      replication_difficulty: candidate.replication_difficulty,
      difficulty_score: computed_score,
    };

    const parsed = SeedClipSchema.safeParse(clip);
    if (!parsed.success) {
      console.error(`INVALID ${candidate.id}:`, parsed.error.issues);
      errors.push(`${candidate.id}: zod validation failed`);
      continue;
    }

    seedClips.push(parsed.data);
    console.log(
      `OK ${candidate.id} → ${parsed.data.skill_category}/${parsed.data.difficulty} (score ${computed_score})`
    );
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(seedClips, null, 2));

  console.log(`\n─── Curation complete ───`);
  console.log(`Seed clips: ${seedClips.length}/15`);
  console.log(`Skipped: ${errors.length}`);
  if (errors.length) {
    console.log(`Errors:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
  console.log(`Output: ${OUTPUT_FILE}`);
}

run();
