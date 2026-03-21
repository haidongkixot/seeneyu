/**
 * Pipeline Step 2: Clip Annotation (AI-generated via GPT-4o)
 *
 * Reads: .shared/outputs/data/clips-raw.json + clip-candidates.json
 * Writes: .shared/outputs/data/clip-annotations.json
 * Checkpoint: .shared/outputs/data/checkpoints/clip-annotation.json
 *
 * For each clip in clips-raw.json with status "candidate":
 *   - Find its matching candidate in clip-candidates.json for context
 *   - Call GPT-4o to generate learning annotation
 *   - Save annotation to clip-annotations.json
 *
 * Run: npm run annotate
 */

import fs from "fs";
import path from "path";
import { config } from "dotenv";
config({ path: path.resolve("../../../.env.local") });

import OpenAI from "openai";
import {
  initCheckpoint,
  saveCheckpoint,
  recordError,
  completeCheckpoint,
} from "./lib/checkpoint.js";

const SHARED = path.resolve("../../../.shared/outputs/data");
const RAW_FILE = path.join(SHARED, "clips-raw.json");
const CANDIDATES_FILE = path.join(SHARED, "clip-candidates.json");
const OUTPUT_FILE = path.join(SHARED, "clip-annotations.json");
const PIPELINE = "clip-annotation";

const SKILL_DESCRIPTIONS: Record<string, string> = {
  "eye-contact": "maintaining intentional, confident eye contact",
  "open-posture": "using open, expansive, non-defensive body posture",
  "active-listening": "demonstrating focused, visible, non-reactive listening",
  "vocal-pacing": "controlling speech tempo, pausing strategically, using silence",
  "confident-disagreement":
    "holding a contrary position calmly without aggression or collapse",
};

interface RawClip {
  youtube_video_id: string;
  title: string;
  channel: string;
  duration_seconds: number;
  view_count: number;
  published_at: string;
  search_query: string;
  candidate_skill: string;
  candidate_id: string;
  status: string;
}

interface ClipCandidate {
  id: string;
  movie_title: string;
  character_name?: string;
  scene_description: string;
  target_skill: string;
  context_note?: string;
}

interface ClipAnnotation {
  youtube_video_id: string;
  candidate_id: string;
  annotation: string;
  watch_for: string;
  skill_demonstrated: string;
}

async function annotateClip(
  openai: OpenAI,
  clip: RawClip,
  candidate: ClipCandidate
): Promise<ClipAnnotation> {
  const skillDesc = SKILL_DESCRIPTIONS[clip.candidate_skill] ?? clip.candidate_skill;

  const prompt = `You are a body language coach annotating a movie clip for learners.

Movie clip: "${clip.title}" from "${candidate.movie_title}"
Character: ${candidate.character_name ?? "unknown"}
Scene context: ${candidate.scene_description}
Target skill: ${clip.candidate_skill} — ${skillDesc}
${candidate.context_note ? `Coach note: ${candidate.context_note}` : ""}

Write a learning annotation for this clip that:
1. Points out EXACTLY what physical or vocal signal to watch (be specific about body part, timing, or pattern)
2. Names the skill being demonstrated in plain language
3. Explains WHY this technique works in real interactions (social/psychological reason)

Keep it 2–3 sentences, direct, coaching tone. No movie spoilers. No fluff.

Return valid JSON only:
{
  "annotation": "2-3 sentence learning annotation",
  "watch_for": "one specific, concrete thing to observe (e.g. 'Notice how he holds eye contact for 2–3 seconds before breaking')",
  "skill_demonstrated": "${clip.candidate_skill}"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = JSON.parse(response.choices[0].message.content ?? "{}") as {
    annotation: string;
    watch_for: string;
    skill_demonstrated: string;
  };

  return {
    youtube_video_id: clip.youtube_video_id,
    candidate_id: clip.candidate_id,
    annotation: result.annotation,
    watch_for: result.watch_for,
    skill_demonstrated: result.skill_demonstrated,
  };
}

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: OPENAI_API_KEY not set in .env.local");
    process.exit(1);
  }

  if (!fs.existsSync(RAW_FILE)) {
    console.error("ERROR: clips-raw.json not found — run 1-discover-clips.ts first");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });
  const rawClips: RawClip[] = JSON.parse(fs.readFileSync(RAW_FILE, "utf-8"));
  const candidates: ClipCandidate[] = JSON.parse(
    fs.readFileSync(CANDIDATES_FILE, "utf-8")
  );

  const toAnnotate = rawClips.filter((c) => c.status === "candidate");
  const checkpoint = initCheckpoint(PIPELINE, toAnnotate.length, OUTPUT_FILE);

  let annotations: ClipAnnotation[] = fs.existsSync(OUTPUT_FILE)
    ? JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"))
    : [];

  let resumeIdx = 0;
  if (checkpoint.last_processed) {
    resumeIdx =
      toAnnotate.findIndex((c) => c.candidate_id === checkpoint.last_processed) + 1;
  }

  for (let i = resumeIdx; i < toAnnotate.length; i++) {
    const clip = toAnnotate[i];
    const candidate = candidates.find((c) => c.id === clip.candidate_id);
    if (!candidate) {
      console.warn(`No candidate found for ${clip.candidate_id}, skipping`);
      continue;
    }

    console.log(`[${i + 1}/${toAnnotate.length}] Annotating: ${clip.candidate_id}`);

    try {
      const annotation = await annotateClip(openai, clip, candidate);

      annotations = annotations.filter((a) => a.candidate_id !== clip.candidate_id);
      annotations.push(annotation);
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(annotations, null, 2));

      console.log(`  Done: "${annotation.watch_for.slice(0, 60)}..."`);
    } catch (err) {
      console.error(`  Failed: ${err}`);
      recordError(checkpoint, clip.candidate_id, err);
    }

    checkpoint.last_processed = clip.candidate_id;
    checkpoint.completed_items = i + 1;
    saveCheckpoint(checkpoint);

    // Rate limit
    await new Promise((r) => setTimeout(r, 500));
  }

  completeCheckpoint(checkpoint);
  console.log(`\nAnnotations saved to: ${OUTPUT_FILE}`);
  console.log(`Total annotations: ${annotations.length}`);
}

run().catch(console.error);
