/**
 * state-update.js
 * Safe read-modify-write for shared state files with file locking.
 * Prevents race conditions when multiple roles edit milestones.json, project-state.json, etc.
 *
 * RULE: Only PM should edit milestones.json and project-state.json directly.
 * Other roles should signal PM with updates instead.
 *
 * Usage (CLI):
 *   node scripts/state-update.js --file milestones.json --merge '{"milestones": [...]}'
 *
 * Usage (programmatic):
 *   const { safeUpdateState } = require('./state-update');
 *   safeUpdateState('milestones.json', (currentData) => {
 *     // modify currentData
 *     return currentData;
 *   });
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

/**
 * Safely read, modify, and write a state file with locking.
 * @param {string} filename - Relative to .shared/state/ (e.g., 'milestones.json')
 * @param {function} modifier - Receives current JSON data, must return modified data
 * @returns {object} The modified data
 */
function safeUpdateState(filename, modifier) {
  const filePath = path.resolve('.shared/state', filename);
  const lockPath = filePath + '.lock';

  acquireLock(lockPath);
  try {
    const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const modified = modifier(current);

    const tmpPath = filePath + '.tmp.' + process.pid;
    fs.writeFileSync(tmpPath, JSON.stringify(modified, null, 2));
    fs.renameSync(tmpPath, filePath);

    return modified;
  } finally {
    releaseLock(lockPath);
  }
}

module.exports = { safeUpdateState };

// CLI mode — deep merge a JSON patch into a state file
if (require.main === module) {
  const args = process.argv.slice(2);
  const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
  const filename = get('--file');
  const mergePatch = get('--merge');

  if (!filename || !mergePatch) {
    console.error('Usage: node scripts/state-update.js --file <filename.json> --merge \'{"key": "value"}\'');
    process.exit(1);
  }

  try {
    const patch = JSON.parse(mergePatch);
    const result = safeUpdateState(filename, (current) => {
      // Shallow merge top-level keys; arrays are replaced, not appended
      return { ...current, ...patch };
    });
    console.log(`✓ Updated .shared/state/${filename}`);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}
