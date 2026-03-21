/**
 * Checkpoint read/write utilities
 * Every pipeline step must call saveCheckpoint after each item processed.
 * On startup, call loadCheckpoint — if status is "in-progress", resume from last_processed.
 */

import fs from "fs";
import path from "path";

export interface Checkpoint {
  pipeline: string;
  status: "in-progress" | "complete" | "failed" | "skipped";
  last_processed: string | null;
  total_items: number;
  completed_items: number;
  output_file: string;
  errors: Array<{ item_id: string; error: string; timestamp: string }>;
  started_at: string;
  updated_at: string;
}

const CHECKPOINTS_DIR = path.resolve(
  "../../../.shared/outputs/data/checkpoints"
);

export function checkpointPath(pipelineName: string): string {
  return path.join(CHECKPOINTS_DIR, `${pipelineName}.json`);
}

export function loadCheckpoint(pipelineName: string): Checkpoint | null {
  const file = checkpointPath(pipelineName);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8")) as Checkpoint;
}

export function saveCheckpoint(checkpoint: Checkpoint): void {
  const file = checkpointPath(checkpoint.pipeline);
  fs.mkdirSync(CHECKPOINTS_DIR, { recursive: true });
  checkpoint.updated_at = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(checkpoint, null, 2));
}

export function initCheckpoint(
  pipelineName: string,
  totalItems: number,
  outputFile: string
): Checkpoint {
  const existing = loadCheckpoint(pipelineName);
  if (existing && existing.status === "in-progress") {
    console.log(
      `[${pipelineName}] Resuming from checkpoint: ${existing.last_processed} (${existing.completed_items}/${existing.total_items})`
    );
    return existing;
  }
  const checkpoint: Checkpoint = {
    pipeline: pipelineName,
    status: "in-progress",
    last_processed: null,
    total_items: totalItems,
    completed_items: 0,
    output_file: outputFile,
    errors: [],
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveCheckpoint(checkpoint);
  return checkpoint;
}

export function recordError(
  checkpoint: Checkpoint,
  itemId: string,
  error: unknown
): void {
  checkpoint.errors.push({
    item_id: itemId,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  });
  saveCheckpoint(checkpoint);
}

export function completeCheckpoint(checkpoint: Checkpoint): void {
  checkpoint.status = "complete";
  saveCheckpoint(checkpoint);
  console.log(
    `[${checkpoint.pipeline}] Complete — ${checkpoint.completed_items}/${checkpoint.total_items} items, ${checkpoint.errors.length} errors`
  );
}
