Broadcast a session checkpoint to all roles and commit shared state.

Run this command when you sense the context window is getting heavy (long conversation, many files read, complex reasoning chains).

Steps to execute:
1. Run `npm run session:checkpoint` from the project root (`D:/Claude Projects/seeneyu`)
2. Tell the user: "Checkpoint broadcast sent. Each role will save their work. When all roles have written 'checkpoint-saved' to pm.json, close all windows and run `npm run session:start` to restart."
3. Do NOT do any further work after broadcasting — the session is winding down.
