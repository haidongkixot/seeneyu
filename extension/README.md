# Seeneyu Mirror Mode — Browser Extension (M46)

Private real-time body-language coaching during Zoom / Meet / Teams calls. All analysis runs locally; video and audio never leave the device.

## Layout

```
manifest.json                 MV3 manifest, strict CSP, no content scripts
src/background/               service worker — auth + aggregate buffer + sync
src/offscreen/                offscreen document — ONLY place that touches cam/mic
src/sidepanel/                React HUD + pairing + opt-in
src/lib/                      auth client, messaging, api base, aggregation buffer
public/icons/, public/wasm/   static assets (MediaPipe WASM goes here)
```

## Dev

```
# From the monorepo root
pnpm -w install
pnpm --filter @seeneyu/extension dev
```

Load `extension/dist/` as an unpacked extension in `chrome://extensions`.

The dev build expects the seeneyu backend at `https://seeneyu.vercel.app` by default.
Override for local development:

```js
chrome.storage.local.set({ apiBase: 'http://localhost:3000' })
```

## Environment (backend)

Set these in Vercel for `/api/extension/*` to activate:

| Variable | Purpose |
|---|---|
| `EXTENSION_ENABLED` | `true` to enable. Anything else → all endpoints return 503. |
| `EXTENSION_IDS` | Comma-separated list of allowed `chrome.runtime.id` values. |

## Privacy invariants (check before shipping)

1. DevTools Network tab on the extension: zero `multipart/form-data`, zero `video/*` / `audio/*` Content-Types, zero requests to non-seeneyu hosts.
2. With `extensionMetricsOptIn=false` (default), end of session → **no** request to `/api/extension/metrics`.
3. Tampering `X-Extension-Id` → server 401.
4. `EXTENSION_ENABLED=false` → HUD still works locally; backend returns 503 everywhere; extension degrades to "sync paused".
