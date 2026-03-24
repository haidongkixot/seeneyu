/**
 * signal-done.js <signal-id>
 * Marks a signal as done on the board and moves it to archive.
 * Usage: node scripts/signal-done.js sig_pm_builder_001
 */
const fs = require('fs');
const path = require('path');

const signalId = process.argv[2];
if (!signalId) { console.error('Usage: node scripts/signal-done.js <signal-id>'); process.exit(1); }

const boardPath = path.resolve('.shared/signals/board.json');
const archivePath = path.resolve('.shared/signals/archive.json');

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

fs.writeFileSync(boardPath, JSON.stringify(board, null, 2));
fs.writeFileSync(archivePath, JSON.stringify(archive, null, 2));

console.log(`✓ Signal '${signalId}' archived (${done.to} ← ${done.from}): ${done.task || done.type}`);
console.log(`Board: ${board.signals.length} remaining open`);
