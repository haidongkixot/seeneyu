/**
 * signal-send.js
 * Appends a new signal to board.json with file-level locking to prevent race conditions.
 * Usage: node scripts/signal-send.js --from pm --to builder --type task-assign --task "my-task" --priority high --message "Do X then Y"
 *
 * Or use programmatically:
 *   const { sendSignal } = require('./signal-send');
 *   sendSignal({ from, to, type, task, priority, message });
 */
const fs = require('fs');
const path = require('path');

const LOCK_TIMEOUT = 10000; // 10s max wait
const LOCK_RETRY_MS = 50;   // retry every 50ms

function acquireLock(lockPath) {
  const start = Date.now();
  while (Date.now() - start < LOCK_TIMEOUT) {
    try {
      // O_EXCL fails if file exists — atomic create-or-fail
      fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
      return true;
    } catch (e) {
      if (e.code === 'EEXIST') {
        // Check for stale lock (>30s old)
        try {
          const stat = fs.statSync(lockPath);
          if (Date.now() - stat.mtimeMs > 30000) {
            fs.unlinkSync(lockPath); // stale lock — remove it
            continue;
          }
        } catch { /* stat failed, retry */ }
        // Wait and retry
        const waitUntil = Date.now() + LOCK_RETRY_MS;
        while (Date.now() < waitUntil) { /* busy wait */ }
        continue;
      }
      throw e;
    }
  }
  throw new Error(`Could not acquire lock on ${lockPath} after ${LOCK_TIMEOUT}ms`);
}

function releaseLock(lockPath) {
  try { fs.unlinkSync(lockPath); } catch { /* ignore */ }
}

function sendSignal({ from, to, type, task, priority = 'medium', message, extra = {} }) {
  const boardPath = path.resolve('.shared/signals/board.json');
  const lockPath = boardPath + '.lock';

  acquireLock(lockPath);
  try {
    // Re-read board INSIDE the lock to get latest state
    const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));

    const id = `sig_${from}_${to}_${Date.now()}`;
    const signal = {
      id,
      from,
      to,
      type,
      task,
      priority,
      message,
      timestamp: new Date().toISOString(),
      status: 'unread',
      ...extra
    };

    board.signals.unshift(signal);
    // Re-sort: high → medium → low, then timestamp desc
    const order = { high: 0, medium: 1, low: 2 };
    board.signals.sort((a, b) => {
      const pd = (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
      return pd !== 0 ? pd : new Date(b.timestamp) - new Date(a.timestamp);
    });
    board._meta.open_count = board.signals.length;
    board._meta.last_updated = new Date().toISOString();

    // Atomic write: write to temp file then rename
    const tmpPath = boardPath + '.tmp.' + process.pid;
    fs.writeFileSync(tmpPath, JSON.stringify(board, null, 2));
    fs.renameSync(tmpPath, boardPath);

    console.log(`✓ Signal sent → ${to} (${type}): ${task || message.slice(0, 60)}`);
    return id;
  } finally {
    releaseLock(lockPath);
  }
}

module.exports = { sendSignal };

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
  const from = get('--from');
  const to = get('--to');
  const type = get('--type') || 'fyi';
  const task = get('--task');
  const priority = get('--priority') || 'medium';
  const message = get('--message');
  if (!from || !to || !message) {
    console.error('Usage: node scripts/signal-send.js --from <role> --to <role> --message "..." [--type task-assign] [--task name] [--priority high]');
    process.exit(1);
  }
  sendSignal({ from, to, type, task, priority, message });
}
