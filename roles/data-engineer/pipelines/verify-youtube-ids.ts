/**
 * YouTube ID Verification + Fill
 *
 * This is the CRITICAL step before DB seeding.
 * Reads clips-seed.json, finds all NEEDS_VERIFICATION entries,
 * searches YouTube using the youtube_search_query field,
 * picks the best match, and updates clips-seed.json in-place.
 *
 * Checkpoint: .shared/outputs/data/checkpoints/youtube-verify.json
 *
 * Run: npm run verify
 * Or add to package.json scripts: "verify": "tsx verify-youtube-ids.ts"
 *
 * After running: inspect clips-seed.json manually, confirm IDs look correct,
 * then run: npx tsx prisma/seed.ts
 */

import fs from "fs";
import path from "path";
import { config } from "dotenv";
config({ path: path.resolve("../../../.env.local") });

import {
  initCheckpoint,
  saveCheckpoint,
  recordError,
  completeCheckpoint,
} from "./lib/checkpoint.js";
import { searchYouTube, getVideoDetails } from "./lib/youtube.js";

const SHARED = path.resolve("../../../.shared/outputs/data");
const SEED_FILE = path.join(SHARED, "clips-seed.json");
const PIPELINE = "youtube-verify";
const OUTPUT_FILE = SEED_FILE; // updates in place

interface SeedClip {
  id: string;
  youtube_video_id: string;
  youtube_search_query: string;
  movie_title: string;
  character_name?: string;
  skill_category: string;
  difficulty: string;
  start_sec: number;
  end_sec: number;
}

interface SeedFile {
  _meta: Record<string, unknown>;
  clips: SeedClip[];
}

async function run() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("ERROR: YOUTUBE_API_KEY not set in .env.local");
    process.exit(1);
  }

  const seedData = JSON.parse(fs.readFileSync(SEED_FILE, "utf-8")) as SeedFile;
  const toVerify = seedData.clips.filter(
    (c) => c.youtube_video_id === "NEEDS_VERIFICATION"
  );

  if (toVerify.length === 0) {
    console.log("All YouTube IDs already verified.");
    return;
  }

  console.log(`${toVerify.length} clip(s) need YouTube ID verification`);

  const checkpoint = initCheckpoint(PIPELINE, toVerify.length, OUTPUT_FILE);

  let resumeIdx = 0;
  if (checkpoint.last_processed) {
    resumeIdx = toVerify.findIndex((c) => c.id === checkpoint.last_processed) + 1;
    console.log(`Resuming from index ${resumeIdx}`);
  }

  for (let i = resumeIdx; i < toVerify.length; i++) {
    const clip = toVerify[i];
    console.log(`\n[${i + 1}/${toVerify.length}] ${clip.id}`);
    console.log(`  Movie: ${clip.movie_title}`);
    console.log(`  Query: "${clip.youtube_search_query}"`);

    try {
      const results = await searchYouTube(clip.youtube_search_query, apiKey, 5);

      if (!results.length) {
        console.warn(`  WARNING: No results for "${clip.youtube_search_query}"`);
        recordError(checkpoint, clip.id, "No search results");
        continue;
      }

      // Get details for top 3
      const details = await Promise.allSettled(
        results.slice(0, 3).map((r) => getVideoDetails(r.youtube_video_id, apiKey))
      );
      const valid = details
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((v) => v !== null && v.duration_seconds >= 30 && v.duration_seconds <= 600);

      if (!valid.length) {
        console.warn(`  WARNING: No suitable results (duration out of range)`);
        recordError(checkpoint, clip.id, "No suitable results");
        continue;
      }

      const best = valid.sort((a, b) => b!.view_count - a!.view_count)[0]!;

      // Update in seed data
      const idx = seedData.clips.findIndex((c) => c.id === clip.id);
      if (idx !== -1) {
        seedData.clips[idx].youtube_video_id = best.youtube_video_id;
      }
      fs.writeFileSync(SEED_FILE, JSON.stringify(seedData, null, 2));

      console.log(`  FOUND: ${best.youtube_video_id}`);
      console.log(`  Title: "${best.title}"`);
      console.log(`  Views: ${best.view_count.toLocaleString()} | Duration: ${best.duration_seconds}s`);
      console.log(`  URL:   https://www.youtube.com/watch?v=${best.youtube_video_id}`);
      console.log(`  ⚠️  MANUALLY VERIFY this is the correct clip before seeding`);
    } catch (err) {
      console.error(`  ERROR: ${err}`);
      recordError(checkpoint, clip.id, err);
    }

    checkpoint.last_processed = clip.id;
    checkpoint.completed_items = i + 1;
    saveCheckpoint(checkpoint);

    await new Promise((r) => setTimeout(r, 1200));
  }

  completeCheckpoint(checkpoint);

  const remaining = seedData.clips.filter(
    (c) => c.youtube_video_id === "NEEDS_VERIFICATION"
  ).length;

  console.log(`\n─── Verification run complete ───`);
  console.log(`Verified:  ${toVerify.length - checkpoint.errors.length}`);
  console.log(`Errors:    ${checkpoint.errors.length}`);
  console.log(`Remaining: ${remaining}`);

  if (remaining === 0) {
    console.log("\n✓ All YouTube IDs filled. Review clips-seed.json manually,");
    console.log("  then run: npx tsx prisma/seed.ts");
  } else {
    console.log(`\n${remaining} IDs still need manual verification.`);
  }
}

run().catch(console.error);
