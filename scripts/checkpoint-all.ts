/**
 * seeneyu — Broadcast Session Checkpoint to All Roles
 *
 * Run this when the PM context window is ~90% full.
 * It writes a "session-checkpoint" signal to every role's queue,
 * then commits all .shared/ state to git so nothing is lost.
 *
 * Usage:  npm run session:checkpoint
 */

import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

const PROJECT_ROOT = join(__dirname, '..')
const SIGNALS_DIR  = join(PROJECT_ROOT, '.shared', 'signals')

const ROLES = [
  'designer',
  'backend-engineer',
  'builder',
  'data-engineer',
  'tester',
  'reporter',
  'marketer',
]

// ── 1. Build the checkpoint signal ─────────────────────────────────────────

const ts        = new Date().toISOString()
const sessionId = Date.now()

const signal = {
  id:        `sig_pm_checkpoint_${sessionId}`,
  from:      'pm',
  type:      'session-checkpoint',
  priority:  'high',
  message:
    'PM context window is at ~90% — session restart is imminent. ' +
    'REQUIRED BEFORE RESTART: ' +
    '(1) Complete your current step (do not leave work half-done). ' +
    '(2) Update your progress/checkpoint file in .shared/outputs/<your-role>/. ' +
    '(3) Write a "checkpoint-saved" signal to pm.json listing what you finished and what is next. ' +
    'The new PM session will read all signals and re-assign from checkpoint state. ' +
    'Your .shared/outputs/<role>/progress.json is the source of truth for recovery.',
  timestamp: ts,
  status:    'unread',
}

// ── 2. Append signal to each role's queue ──────────────────────────────────

let signaled = 0

for (const role of ROLES) {
  const signalFile = join(SIGNALS_DIR, `${role}.json`)
  try {
    const raw  = readFileSync(signalFile, 'utf-8')
    const data = JSON.parse(raw) as { signals: any[] }
    data.signals.push({ ...signal, id: `sig_pm_checkpoint_${sessionId}_${role}` })
    writeFileSync(signalFile, JSON.stringify(data, null, 2))
    console.log(`  ✓ Signaled: ${role}`)
    signaled++
  } catch (err) {
    console.warn(`  ✗ Could not signal ${role}: ${(err as Error).message}`)
  }
}

// ── 3. Commit .shared/ state to git ────────────────────────────────────────

console.log('\nCommitting shared state to git...')
try {
  execSync('git add .shared/', { cwd: PROJECT_ROOT, stdio: 'pipe' })
  const status = execSync('git status --porcelain .shared/', { cwd: PROJECT_ROOT }).toString().trim()

  if (status) {
    execSync(
      `git commit -m "checkpoint: session state at ${new Date().toLocaleString()}"`,
      { cwd: PROJECT_ROOT, stdio: 'pipe' }
    )
    console.log('  ✓ .shared/ committed to git')
  } else {
    console.log('  ✓ .shared/ already clean — nothing to commit')
  }
} catch (err) {
  console.warn(`  ✗ Git commit failed: ${(err as Error).message}`)
  console.warn('    Signals were still written — state is saved in files.')
}

// ── 4. Print restart instructions ──────────────────────────────────────────

console.log(`
╔══════════════════════════════════════════════════════════════╗
║              SESSION CHECKPOINT BROADCAST DONE               ║
╠══════════════════════════════════════════════════════════════╣
║  Roles signaled: ${String(signaled).padEnd(43)}║
║  Timestamp:      ${ts.slice(0, 19).padEnd(43)}║
╠══════════════════════════════════════════════════════════════╣
║  NEXT STEPS:                                                 ║
║  1. Wait for each role to write "checkpoint-saved" to pm.json║
║  2. Close this PM window                                     ║
║  3. Run: .\\scripts\\start-session.ps1  to restart all windows ║
║  4. New PM session reads signals and resumes from state      ║
╚══════════════════════════════════════════════════════════════╝
`)
