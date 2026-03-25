/**
 * signal-done.js <signal-id>
 * Marks a signal as done on the board and moves it to archive.
 * Uses file locking to prevent race conditions.
 * Usage: node scripts/signal-done.js sig_pm_builder_001
 */
const fs = require('fs');
const path = require('path');

const LOCK_TIMEOUT = 10000;
const LOCK_RETRY_MS = 50;

function acquireLock(lockPath) {
  const start = Date.now();
  while (Date.now() - start < LOCK_TIMEOUT) {
    try {
      fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
      return true;
    } catch (e) {
      if (e.code === 'EEXIST') {
        try {
          const stat = fs.statSync(lockPath);
          if (Date.now() - stat.mtimeMs > 30000) {
            fs.unlinkSync(lockPath);
            continue;
          }
        } catch { /* retry */ }
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

const signalId = process.argv[2];
if (!signalId) { console.error('Usage: node scripts/signal-done.js <signal-id>'); process.exit(1); }

const boardPath = path.resolve('.shared/signals/board.json');
const archivePath = path.resolve('.shared/signals/archive.json');
const lockPath = boardPath + '.lock';

acquireLock(lockPath);
try {
  const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));
  const archive = fs.existsSync(archivePath)
    ? JSON.parse(fs.readFileSync(archivePath, 'utf8'))
    : { _meta: { description: 'Signal archive', total: 0 }, signals: [] };

  const idx = board.signals.findIndex(s => s.id === signalId);
  if (idx === -1) { console.error(`Signal not found on board: ${signalId}`); process.exit(1); }

  const [done] = board.signals.splice(idx, 1);
  done.status = 'done';
  done.done_at = new Date().toISOString();

  archive.signals.push(done);
  archive._meta.total = archive.signals.length;
  archive._meta.last_updated = new Date().toISOString();

  board._meta.open_count = board.signals.length;
  board._meta.last_updated = new Date().toISOString();

  // Atomic writes via temp + rename
  const tmpBoard = boardPath + '.tmp.' + process.pid;
  const tmpArchive = archivePath + '.tmp.' + process.pid;
  fs.writeFileSync(tmpBoard, JSON.stringify(board, null, 2));
  fs.renameSync(tmpBoard, boardPath);
  fs.writeFileSync(tmpArchive, JSON.stringify(archive, null, 2));
  fs.renameSync(tmpArchive, archivePath);

  console.log(`✓ Signal '${signalId}' archived (${done.to} ← ${done.from}): ${done.task || done.type}`);
  console.log(`Board: ${board.signals.length} remaining open`);
} finally {
  releaseLock(lockPath);
}
