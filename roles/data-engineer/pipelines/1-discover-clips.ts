/**
 * Pipeline Step 1: YouTube Clip Discovery
 *
 * Reads: .shared/outputs/data/clip-candidates.json
 * Writes: .shared/outputs/data/clips-raw.json
 * Checkpoint: .shared/outputs/data/checkpoints/clip-discovery.json
 *
 * For each candidate with status "pending":
 *   - Try each search_query in order
 *   - Pick the best result (highest view count, duration 60–300s)
 *   - Update candidate status to "found" and fill youtube_video_id
 *
 * Run: npm run discover
 * Resume: re-run same command — checkpoint handles resume automatically
 */

import fs from "fs";
import path from "path";
import { config } from "dotenv";

// Load .env.local from project root (three levels up from pipelines/)
config({ path: path.resolve("../../../.env.local") });

import {
  initCheckpoint,
  saveCheckpoint,
  recordError,
  completeCheckpoint,
  type Checkpoint,
} from "./lib/checkpoint.js";
import { searchYouTube, getVideoDetails } from "./lib/youtube.js";

const SHARED = path.resolve("../../../.shared/outputs/data");
const CANDIDATES_FILE = path.join(SHARED, "clip-candidates.json");
const OUTPUT_FILE = path.join(SHARED, "clips-raw.json");
const PIPELINE = "clip-discovery";

interface ClipCandidate {
  id: string;
  movie_title: string;
  character_name?: string;
  scene_description: string;
  target_skill: string;
  target_difficulty: string;
  search_queries: string[];
  youtube_video_id: string | null;
  start_sec: number | null;
  end_sec: number | null;
  signal_clarity: number;
  noise_level: number;
  context_dependency: number;
  replication_difficulty: number;
  difficulty_score: number;
  context_note?: string;
  status: string;
}

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
  status: "candidate";
}

async function run() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error(
      "ERROR: YOUTUBE_API_KEY not set in .env.local — cannot run discovery pipeline"
    );
    console.error(
      "Add YOUTUBE_API_KEY=<your_key> to D:/Claude Projects/seeneyu/.env.local"
    );
    process.exit(1);
  }

  const candidates: ClipCandidate[] = JSON.parse(
    fs.readFileSync(CANDIDATES_FILE, "utf-8")
  );
  const pending = candidates.filter((c) => c.status === "pending");

  const checkpoint = initCheckpoint(PIPELINE, pending.length, OUTPUT_FILE);

  // Load existing raw clips output (for incremental saves)
  let rawClips: RawClip[] = fs.existsSync(OUTPUT_FILE)
    ? JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"))
    : [];

  // Find resume point
  let resumeIdx = 0;
  if (checkpoint.last_processed) {
    resumeIdx =
      pending.findIndex((c) => c.id === checkpoint.last_processed) + 1;
    console.log(
      `Resuming from index ${resumeIdx} (after ${checkpoint.last_processed})`
    );
  }

  for (let i = resumeIdx; i < pending.length; i++) {
    const candidate = pending[i];
    console.log(
      `[${i + 1}/${pending.length}] Searching for: ${candidate.id}`
    );

    let found = false;
    for (const query of candidate.search_queries) {
      try {
        console.log(`  Query: "${query}"`);
        const results = await searchYouTube(query, apiKey, 5);

        if (!results.length) continue;

        // Get details for first 3 results, pick best
        const detailed = await Promise.allSettled(
          results.slice(0, 3).map((r) => getVideoDetails(r.youtube_video_id, apiKey))
        );

        const valid = detailed
          .map((r) => (r.status === "fulfilled" ? r.value : null))
          .filter(
            (v) =>
              v !== null &&
              v.duration_seconds >= 30 &&
              v.duration_seconds <= 600
          );

        if (!valid.length) continue;

        // Pick highest view count
        const best = valid.sort((a, b) => b!.view_count - a!.view_count)[0]!;

        const rawClip: RawClip = {
          youtube_video_id: best.youtube_video_id,
          title: best.title,
          channel: best.channel,
          duration_seconds: best.duration_seconds,
          view_count: best.view_count,
          published_at: best.published_at,
          search_query: query,
          candidate_skill: candidate.target_skill,
          candidate_id: candidate.id,
          status: "candidate",
        };

        // Update raw clips output
        rawClips = rawClips.filter(
          (r) => r.candidate_id !== candidate.id
        );
        rawClips.push(rawClip);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rawClips, null, 2));

        // Update candidate status in candidates file
        candidate.youtube_video_id = best.youtube_video_id;
        candidate.status = "found";
        fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2));

        console.log(
          `  Found: "${best.title}" (${best.view_count.toLocaleString()} views, ${best.duration_seconds}s)`
        );
        found = true;
        break;
      } catch (err) {
        console.error(`  Query failed: ${err}`);
        recordError(checkpoint, candidate.id, err);
      }
    }

    if (!found) {
      console.warn(`  WARNING: No suitable video found for ${candidate.id}`);
      recordError(checkpoint, candidate.id, "No suitable video found");
    }

    checkpoint.last_processed = candidate.id;
    checkpoint.completed_items = i + 1;
    saveCheckpoint(checkpoint);

    // Rate limit: 1 req/sec to stay within YouTube API quota
    await new Promise((r) => setTimeout(r, 1000));
  }

  completeCheckpoint(checkpoint);
  console.log(`\nOutput saved to: ${OUTPUT_FILE}`);
  console.log(`Raw clip candidates: ${rawClips.length}`);
}

run().catch(console.error);
