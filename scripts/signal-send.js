/**
 * signal-send.js
 * Appends a new signal to board.json.
 * Usage: node scripts/signal-send.js --from pm --to builder --type task-assign --task "my-task" --priority high --message "Do X then Y"
 *
 * Or use programmatically:
 *   const { sendSignal } = require('./signal-send');
 *   sendSignal({ from, to, type, task, priority, message });
 */
const fs = require('fs');
const path = require('path');

function sendSignal({ from, to, type, task, priority = 'medium', message, extra = {} }) {
  const boardPath = path.resolve('.shared/signals/board.json');
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

  board.signals.unshift(signal); // newest first for high priority, but sort handles it
  // Re-sort: high → medium → low, then timestamp desc
  const order = { high: 0, medium: 1, low: 2 };
  board.signals.sort((a, b) => {
    const pd = (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
    return pd !== 0 ? pd : new Date(b.timestamp) - new Date(a.timestamp);
  });
  board._meta.open_count = board.signals.length;
  board._meta.last_updated = new Date().toISOString();

  fs.writeFileSync(boardPath, JSON.stringify(board, null, 2));
  console.log(`✓ Signal sent → ${to} (${type}): ${task || message.slice(0, 60)}`);
  return id;
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
