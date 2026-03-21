/**
 * Full Pipeline Runner
 * Runs all 3 steps in sequence: discover → annotate → curate
 *
 * Prerequisites:
 *   YOUTUBE_API_KEY=<key>  in .env.local
 *   OPENAI_API_KEY=<key>   in .env.local
 *
 * Run: npm run pipeline
 * Resume: same command — each step checkpoints individually
 */

import { execSync } from "child_process";

function step(name: string, command: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`STEP: ${name}`);
  console.log(`${"═".repeat(60)}`);
  execSync(command, { stdio: "inherit" });
}

step("1 — YouTube Clip Discovery", "npx tsx 1-discover-clips.ts");
step("2 — AI Clip Annotation",     "npx tsx 2-annotate-clips.ts");
step("3 — Curate Seed Data",       "npx tsx 3-curate-seed.ts");

console.log("\n✓ Pipeline complete — seed-clips.json ready for DB seeding");
