/**
 * MediaPipe Technical Architecture PDF Generator
 *
 * Generates: docs/mediapipe-architecture.pdf
 * Pattern: HTML template → Puppeteer → A4 PDF with cover + TOC
 *
 * Usage:
 *   cd docs/pdf-gen && npm install && npm run generate
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ─── Document Content (9 chapters) ─────────────────────────────────────────

const chapters = [

// ── Chapter 1: Executive Summary ────────────────────────────────────────────
{
  title: 'Executive Summary',
  desc: 'What MediaPipe is and why seeneyu uses it',
  content: `
<h1>1. Executive Summary</h1>

<p><strong>Google MediaPipe</strong> is an open-source, cross-platform framework for building multimodal ML pipelines. In seeneyu, it powers <em>real-time body language analysis</em> — detecting facial expressions (52 ARKit blendshapes) and body posture (11 key landmarks) directly in the user's browser, with zero server-side computation.</p>

<blockquote>
<strong>Key insight:</strong> By running ML inference client-side via WebAssembly + WebGL, seeneyu delivers instant feedback (&lt;100ms per frame), eliminates API costs entirely, preserves user privacy (no video leaves the device), and scales to unlimited concurrent users at zero marginal cost.
</blockquote>

<p>MediaPipe replaced GPT-4o Vision as the primary scoring engine in March 2026 (commit <code>b56564b</code>). GPT-4o is retained only for optional rich text coaching feedback — all numerical scoring is now deterministic and reproducible.</p>

<h3>Before vs After</h3>
<table>
<thead><tr><th>Metric</th><th>GPT-4o Vision (before)</th><th>MediaPipe (after)</th></tr></thead>
<tbody>
<tr><td>Latency</td><td>3-8 seconds</td><td>&lt;100 milliseconds</td></tr>
<tr><td>Cost per scoring</td><td>$0.01-0.03</td><td>$0.00</td></tr>
<tr><td>Privacy</td><td>Video frames sent to OpenAI</td><td>All processing on-device</td></tr>
<tr><td>Reproducibility</td><td>Non-deterministic</td><td>Deterministic</td></tr>
<tr><td>Offline capable</td><td>No</td><td>Yes (after model download)</td></tr>
<tr><td>Concurrent users</td><td>Rate-limited by API</td><td>Unlimited</td></tr>
</tbody>
</table>
`,
},

// ── Chapter 2: Architecture Overview ────────────────────────────────────────
{
  title: 'Architecture Overview',
  desc: 'Client-side ML pipeline and data flow',
  content: `
<h1>2. Architecture Overview</h1>

<p>seeneyu's MediaPipe integration follows a <strong>client-capture → server-score → feedback-generate</strong> pipeline:</p>

<pre><code>┌─────────────── Browser (Client) ───────────────┐
│                                                  │
│  Webcam → HTMLVideoElement → useMediaPipe hook   │
│                    │                             │
│         ┌─────────┴──────────┐                   │
│         │                    │                   │
│  FaceLandmarker        PoseLandmarker            │
│  (52 blendshapes)      (11 landmarks)            │
│         │                    │                   │
│         └─────────┬──────────┘                   │
│                   ▼                              │
│        AnalysisSnapshot[]                        │
│  (collected every 500ms/1000ms)                  │
│                   │                              │
└───────────────────┼──────────────────────────────┘
                    │  HTTP POST (JSON)
                    ▼
┌─────────────── Server (Next.js API) ─────────────┐
│                                                   │
│  expression-scorer.ts                             │
│  ├── Cosine similarity (blendshape matching)      │
│  ├── Vector magnitude (intensity)                 │
│  ├── Pose geometry (shoulder openness, head tilt) │
│  └── Consistency analysis (std deviation)         │
│                   │                               │
│                   ▼                               │
│  feedback-generator.ts                            │
│  ├── GPT-4o TEXT (if available) — rich coaching   │
│  └── Template fallback — zero AI dependency       │
│                                                   │
└───────────────────────────────────────────────────┘</code></pre>

<h3>Key Design Decisions</h3>
<ul>
<li><strong>Client-side ML</strong>: WASM + WebGL execution via <code>@mediapipe/tasks-vision</code>. No server GPU required.</li>
<li><strong>Singleton loader</strong>: Models load once per session and are cached by the browser (~8MB total).</li>
<li><strong>GPU delegate</strong>: Both FaceLandmarker and PoseLandmarker use WebGL GPU acceleration.</li>
<li><strong>Snapshot-based</strong>: Instead of continuous streaming, snapshots are collected at fixed intervals (500ms for coaching, 1000ms for arcade) to balance accuracy and performance.</li>
<li><strong>Deterministic scoring</strong>: All score computation uses pure math (cosine similarity, vector operations, standard deviation) — no randomness, no API calls.</li>
</ul>
`,
},

// ── Chapter 3: Core Infrastructure ──────────────────────────────────────────
{
  title: 'Core Infrastructure',
  desc: 'Module-by-module breakdown of the ML pipeline',
  content: `
<h1>3. Core Infrastructure</h1>

<h2>3.1 mediapipe-init.ts — Singleton Loader</h2>
<p>Location: <code>src/lib/mediapipe-init.ts</code></p>

<p>Lazy-loads FaceLandmarker and PoseLandmarker from Google CDN as singletons. Must only be imported dynamically from client components (WASM + WebGL requirement).</p>

<table>
<thead><tr><th>Model</th><th>CDN Source</th><th>Size</th><th>Capabilities</th></tr></thead>
<tbody>
<tr><td>FaceLandmarker</td><td>storage.googleapis.com/.../face_landmarker.task</td><td>~5 MB</td><td>52 blendshapes, face detection</td></tr>
<tr><td>PoseLandmarker (lite)</td><td>storage.googleapis.com/.../pose_landmarker_lite.task</td><td>~3 MB</td><td>33 landmarks (11 key ones extracted)</td></tr>
</tbody>
</table>

<p>Configuration:</p>
<ul>
<li><code>delegate: 'GPU'</code> — WebGL acceleration</li>
<li><code>runningMode: 'VIDEO'</code> — optimized for continuous frame analysis</li>
<li><code>numFaces: 1</code> / <code>numPoses: 1</code> — single-person focus</li>
<li><code>minDetectionConfidence: 0.5</code> — balanced sensitivity</li>
</ul>

<pre><code>// Usage pattern (dynamic import from client component)
const { getAll } = await import('@/lib/mediapipe-init')
const { face, pose } = await getAll()
// face: FaceLandmarker, pose: PoseLandmarker — both ready</code></pre>

<h2>3.2 useMediaPipe.ts — React Hook</h2>
<p>Location: <code>src/hooks/useMediaPipe.ts</code></p>

<p>Client-side React hook that initializes MediaPipe and provides a <code>detectAll()</code> function for per-frame analysis.</p>

<pre><code>const { isReady, isLoading, error, detectAll } = useMediaPipe()

// detectAll: (video: HTMLVideoElement, timestampMs: number) => AnalysisSnapshot | null</code></pre>

<p>The hook:</p>
<ol>
<li>Dynamically imports <code>mediapipe-init.ts</code> on mount</li>
<li>Runs <code>detectForVideo()</code> on both FaceLandmarker and PoseLandmarker</li>
<li>Extracts 52 blendshape values from face result</li>
<li>Extracts 11 key pose landmarks using MediaPipe standard indices</li>
<li>Returns an <code>AnalysisSnapshot</code> combining both results</li>
</ol>

<h3>Pose Landmark Indices (MediaPipe Standard)</h3>
<table>
<thead><tr><th>Landmark</th><th>Index</th><th>Landmark</th><th>Index</th></tr></thead>
<tbody>
<tr><td>Nose</td><td>0</td><td>Left Shoulder</td><td>11</td></tr>
<tr><td>Left Ear</td><td>7</td><td>Right Shoulder</td><td>12</td></tr>
<tr><td>Right Ear</td><td>8</td><td>Left Elbow</td><td>13</td></tr>
<tr><td>Left Wrist</td><td>15</td><td>Right Elbow</td><td>14</td></tr>
<tr><td>Right Wrist</td><td>16</td><td>Left Hip</td><td>23</td></tr>
<tr><td></td><td></td><td>Right Hip</td><td>24</td></tr>
</tbody>
</table>

<h2>3.3 mediapipe-types.ts — Shared Type Definitions</h2>
<p>Location: <code>src/lib/mediapipe-types.ts</code></p>

<p>Defines TypeScript interfaces used by both client and server code:</p>

<table>
<thead><tr><th>Interface</th><th>Purpose</th><th>Key Fields</th></tr></thead>
<tbody>
<tr><td><code>PoseLandmarkData</code></td><td>Extracted pose positions</td><td>11 landmarks × {x, y, z} (normalized 0-1)</td></tr>
<tr><td><code>AnalysisSnapshot</code></td><td>Single analysis frame</td><td>timestampMs, blendshapes (52 values), poseLandmarks, faceDetected</td></tr>
<tr><td><code>ArcadeAnalysisPayload</code></td><td>Client → server for Arcade</td><td>challengeId, snapshots[], peakSnapshot</td></tr>
<tr><td><code>MicroAnalysisPayload</code></td><td>Client → server for Micro-Practice</td><td>snapshots[]</td></tr>
</tbody>
</table>

<h2>3.4 analysis-helpers.ts — Snapshot Collection</h2>
<p>Location: <code>src/lib/analysis-helpers.ts</code></p>

<p>Provides the <code>startAnalysisCollection()</code> factory that creates an <code>AnalysisCollector</code> — collecting MediaPipe snapshots at regular intervals during video capture.</p>

<pre><code>const collector = startAnalysisCollection(videoElement, detectAll, 500)
// ... user records for 10-60 seconds ...
const snapshots = collector.stop()      // AnalysisSnapshot[]
const peak = collector.getPeakSnapshot() // highest expression intensity</code></pre>

<p><strong>Peak snapshot selection:</strong> Computes overall expression intensity as the sum of all non-neutral blendshape values. The snapshot with highest total intensity becomes the "peak" — used as the primary scoring input for Arcade challenges.</p>
`,
},

// ── Chapter 4: Features Using MediaPipe ─────────────────────────────────────
{
  title: 'Features Using MediaPipe',
  desc: 'Three recording modes powered by MediaPipe',
  content: `
<h1>4. Features Using MediaPipe</h1>

<p>MediaPipe powers all three recording/practice modes in seeneyu:</p>

<h2>4.1 Arcade Mode</h2>
<p><strong>Quick 10-second expression challenges.</strong></p>
<ul>
<li><strong>Component:</strong> <code>src/app/arcade/[bundleId]/page.tsx</code></li>
<li><strong>Collection interval:</strong> 1000ms (1 snapshot/second)</li>
<li><strong>Scoring:</strong> Peak snapshot + all snapshots → <code>scoreArcadeAttemptFromAnalysis()</code></li>
<li><strong>Output:</strong> 0-100 score with breakdown (expression_match, intensity, context_fit)</li>
<li><strong>API cost:</strong> $0.00</li>
</ul>

<h2>4.2 Micro-Practice</h2>
<p><strong>Duolingo-style step-by-step skill practice with 30-second recordings.</strong></p>
<ul>
<li><strong>Component:</strong> <code>src/components/MicroPracticeFlow.tsx</code> + <code>PracticeRecorder.tsx</code></li>
<li><strong>Collection interval:</strong> 500ms (2 snapshots/second)</li>
<li><strong>Scoring:</strong> Skill-specific blendshape analysis → <code>scoreMicroPracticeFromAnalysis()</code></li>
<li><strong>Output:</strong> Pass/needs-work verdict, 4 dimension scores, positives, improvements, actionable tips</li>
<li><strong>API cost:</strong> $0.00</li>
</ul>

<h2>4.3 Full Performance</h2>
<p><strong>Complete 30-60 second recording mimicking a movie clip.</strong></p>
<ul>
<li><strong>Component:</strong> <code>src/app/library/[clipId]/record/RecordClient.tsx</code></li>
<li><strong>Collection interval:</strong> 500ms</li>
<li><strong>Scoring:</strong> Multi-dimension analysis → <code>scoreFullPerformanceFromAnalysis()</code></li>
<li><strong>Feedback:</strong> GPT-4o TEXT coaching (optional) OR template-based (zero AI) via <code>feedback-generator.ts</code></li>
<li><strong>Output:</strong> Overall score, 4 skill dimensions (1-10 each), expression/pose timelines, rich coaching feedback</li>
<li><strong>API cost:</strong> $0.00 for scoring; optional $0.01 for GPT-4o text coaching</li>
</ul>

<h3>Feature Comparison</h3>
<table>
<thead><tr><th>Feature</th><th>Duration</th><th>Interval</th><th>Scoring Function</th><th>AI Text</th></tr></thead>
<tbody>
<tr><td>Arcade</td><td>10s</td><td>1000ms</td><td>scoreArcadeAttemptFromAnalysis</td><td>No</td></tr>
<tr><td>Micro-Practice</td><td>30s</td><td>500ms</td><td>scoreMicroPracticeFromAnalysis</td><td>No</td></tr>
<tr><td>Full Performance</td><td>30-60s</td><td>500ms</td><td>scoreFullPerformanceFromAnalysis</td><td>Optional</td></tr>
</tbody>
</table>
`,
},

// ── Chapter 5: Scoring Engine ───────────────────────────────────────────────
{
  title: 'Scoring Engine',
  desc: 'Deep dive into expression-scorer.ts',
  content: `
<h1>5. Scoring Engine</h1>
<p>Location: <code>src/services/expression-scorer.ts</code> (776 lines)</p>

<p>The scoring engine is the heart of seeneyu's analysis pipeline. It converts raw MediaPipe data into meaningful scores through deterministic math — no AI API calls, no randomness.</p>

<h2>5.1 Expression Pattern Library</h2>
<p>A curated library of <strong>25+ expression patterns</strong> mapping human-readable expression names to expected blendshape target values (0.0-1.0):</p>

<table>
<thead><tr><th>Category</th><th>Expressions</th><th>Key Blendshapes</th></tr></thead>
<tbody>
<tr><td>Basic Emotions</td><td>surprise, happy, smile, joy, anger, sad, fear, disgust, contempt</td><td>eyeWide, mouthSmile, browDown, mouthFrown, noseSneer, jawOpen</td></tr>
<tr><td>Communication</td><td>confident, stern, skeptical, empathy, warm, intense, focused</td><td>browDown, mouthPress, browInnerUp, cheekSquint, eyeSquint</td></tr>
<tr><td>Body Language</td><td>defiant, authority, calm, listening, concerned, determined</td><td>jawForward, mouthPress, browInnerUp, mouthSmile</td></tr>
<tr><td>Specific Actions</td><td>raised_eyebrow, wink, pout, speaking</td><td>browOuterUp, eyeBlink, mouthPucker, jawOpen</td></tr>
</tbody>
</table>

<p>Each pattern is a <code>Record&lt;string, number&gt;</code> mapping blendshape names to target activation levels. For example:</p>

<pre><code>surprise: {
  eyeWideLeft: 0.6, eyeWideRight: 0.6,
  browInnerUp: 0.5, browOuterUpLeft: 0.4,
  browOuterUpRight: 0.4, jawOpen: 0.4,
}</code></pre>

<h2>5.2 Keyword Matching</h2>
<p>Challenge descriptions and contexts are matched against a priority-ordered keyword map. More specific keywords take precedence (e.g., "duchenne smile" → <code>joy</code> before "smile" → <code>smile</code>). Multiple matches are merged using max-value for each blendshape.</p>

<h2>5.3 Cosine Similarity Scoring</h2>
<p>The primary scoring mechanism compares the user's actual blendshape vector against the target pattern vector:</p>

<pre><code>similarity(user, target) = (user · target) / (|user| × |target|)

Score = clamp(similarity × 100, 0, 100)</code></pre>

<p>This measures the <em>direction</em> of the expression (which muscles activated) independently of <em>magnitude</em> (how strongly). A user who activates the correct muscles at half intensity still scores well on expression match.</p>

<h2>5.4 Intensity Scoring</h2>
<p>Measures how strongly the user committed to the expression:</p>

<pre><code>intensity = |userVector| / |targetVector| × 80

// Clamped to 0-100</code></pre>

<h2>5.5 Consistency Analysis</h2>
<p>Evaluates how steady the expression was held across all snapshots using coefficient of variation:</p>

<pre><code>CV = standardDeviation(values) / mean(values)
consistency = clamp(100 - CV × 100, 20, 100)</code></pre>

<p>Lower variance → higher consistency score. This rewards users who hold an expression steadily rather than flashing it briefly.</p>

<h2>5.6 Pose Analysis</h2>
<p>Four pose metrics computed from the 11 key landmarks:</p>

<table>
<thead><tr><th>Metric</th><th>Computation</th><th>What It Measures</th></tr></thead>
<tbody>
<tr><td>Shoulder Openness</td><td>shoulderDist / headSize ratio</td><td>Open vs closed body posture</td></tr>
<tr><td>Head Tilt</td><td>atan2(earDy, earDx) in degrees</td><td>Head alignment and attentiveness</td></tr>
<tr><td>Forward Lean</td><td>shoulderMidZ - noseZ</td><td>Engagement and interest</td></tr>
<tr><td>Gesture Activity</td><td>shoulderY - wristY delta</td><td>Active hand gesturing</td></tr>
</tbody>
</table>

<h2>5.7 Final Score Composition</h2>
<h3>Arcade Mode</h3>
<pre><code>finalScore = expressionMatch × 0.5 + intensity × 0.25 + contextFit × 0.25</code></pre>

<h3>Micro-Practice</h3>
<p>Uses skill-specific blendshape groups (e.g., eye-contact uses <code>eyeLookUp/Down/In/Out</code> + <code>eyeBlink</code>). For posture-dominant skills, pose score weighted 70% vs facial 30%.</p>

<h3>Full Performance</h3>
<p>4-dimension scoring (1-10 each) using skill-specific dimension labels. Overall score = mean of dimensions × 10.</p>
`,
},

// ── Chapter 6: Feedback Generation ──────────────────────────────────────────
{
  title: 'Feedback Generation',
  desc: 'Dual-path coaching feedback system',
  content: `
<h1>6. Feedback Generation</h1>
<p>Location: <code>src/services/feedback-generator.ts</code></p>

<p>After MediaPipe scoring produces numerical metrics, the feedback generator transforms them into rich coaching advice. It uses a <strong>dual-path system</strong>:</p>

<h2>6.1 AI Path (GPT-4o TEXT)</h2>
<p>When <code>OPENAI_API_KEY</code> is available, a structured prompt sends the MediaPipe scores to GPT-4o for rich text generation:</p>

<ul>
<li>References specific facial muscles (orbicularis oculi, zygomaticus, frontalis)</li>
<li>Compares user performance to the reference movie scene</li>
<li>Generates numbered action plan steps targeting the weakest dimensions</li>
<li>Provides specific exercises with hold durations and repetitions</li>
<li>Cost: ~$0.01 per feedback request</li>
</ul>

<p><strong>Important:</strong> GPT-4o receives only numerical scores and text context — <em>no video or image data</em>. This is a TEXT-only call, not Vision.</p>

<h2>6.2 Template Path (Zero AI)</h2>
<p>When no API key is available (or if the AI call fails), template-based generation provides immediate feedback:</p>

<ul>
<li>Skill-specific positive/improvement pools for all 5 skill categories</li>
<li>Dynamic template selection based on strongest/weakest dimensions</li>
<li>Coaching tips library (Triangle Technique, Power Reset, Lean-In Rule, etc.)</li>
<li>Action plan generated from dimension scores sorted by weakness</li>
<li>Cost: $0.00</li>
</ul>

<h2>6.3 Output Structure</h2>
<table>
<thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>overallScore</td><td>number (0-100)</td><td>Aggregate performance score</td></tr>
<tr><td>dimensions</td><td>DimensionScore[]</td><td>4 skill-specific scores (1-10)</td></tr>
<tr><td>summary</td><td>string</td><td>2-sentence performance overview</td></tr>
<tr><td>positives</td><td>string[]</td><td>What the user did well</td></tr>
<tr><td>improvements</td><td>string[]</td><td>Specific corrections with body part references</td></tr>
<tr><td>steps</td><td>ActionPlanStep[]</td><td>Numbered action items (what + why)</td></tr>
<tr><td>tips</td><td>FeedbackTip[]</td><td>Named techniques with exercises</td></tr>
<tr><td>modelUsed</td><td>string</td><td>'mediapipe+gpt-4o-text' or 'mediapipe-local'</td></tr>
</tbody>
</table>
`,
},

// ── Chapter 7: The Migration ────────────────────────────────────────────────
{
  title: 'The Migration',
  desc: 'GPT-4o Vision → MediaPipe transition',
  content: `
<h1>7. The Migration</h1>

<p>On March 25, 2026 (commit <code>b56564b</code>), seeneyu migrated from GPT-4o Vision to MediaPipe for all recording scoring. This was one of the most impactful architectural changes in the project.</p>

<h2>7.1 Why We Migrated</h2>
<ul>
<li><strong>Cost:</strong> GPT-4o Vision charged $0.01-0.03 per scoring request. At scale (1000+ daily users × 5 practices), this would cost $50-150/day.</li>
<li><strong>Latency:</strong> API round-trips added 3-8 seconds of waiting. Users expected instant feedback during practice.</li>
<li><strong>Privacy:</strong> Video frames were being sent to OpenAI's servers. Some users (enterprise, education) require data to stay on-device.</li>
<li><strong>Reproducibility:</strong> GPT-4o Vision gave different scores for the same input. This made progress tracking unreliable.</li>
<li><strong>Availability:</strong> API outages or rate limits disrupted the entire coaching flow.</li>
</ul>

<h2>7.2 What Changed</h2>

<h3>New Files (6)</h3>
<table>
<thead><tr><th>File</th><th>Purpose</th><th>Lines</th></tr></thead>
<tbody>
<tr><td>src/lib/mediapipe-init.ts</td><td>Singleton model loader</td><td>70</td></tr>
<tr><td>src/lib/mediapipe-types.ts</td><td>Shared TypeScript interfaces</td><td>43</td></tr>
<tr><td>src/lib/analysis-helpers.ts</td><td>Snapshot collection during recording</td><td>77</td></tr>
<tr><td>src/hooks/useMediaPipe.ts</td><td>React hook for detection</td><td>135</td></tr>
<tr><td>src/services/expression-scorer.ts</td><td>Deterministic scoring engine</td><td>776</td></tr>
<tr><td>src/services/feedback-generator.ts</td><td>Coaching text generation</td><td>243</td></tr>
</tbody>
</table>

<h3>Modified Files (8)</h3>
<p>All three recording flows (Arcade, Micro-Practice, Full Performance) were updated to use the <code>useMediaPipe()</code> hook and <code>startAnalysisCollection()</code> helper. Server-side API routes switched from GPT-4o Vision calls to the new scoring functions.</p>

<h2>7.3 What Was Preserved</h2>
<ul>
<li><strong>GPT-4o TEXT</strong> retained for optional rich coaching feedback (not Vision — text only)</li>
<li><strong>Template fallback</strong> ensures feedback works even without any API key</li>
<li><strong>Recording upload</strong> to Vercel Blob still works for video playback/review</li>
<li><strong>All existing UI</strong> unchanged — the migration was invisible to users</li>
</ul>
`,
},

// ── Chapter 8: Pros and Cons ────────────────────────────────────────────────
{
  title: 'Pros and Cons',
  desc: 'Honest assessment of the MediaPipe approach',
  content: `
<h1>8. Pros and Cons</h1>

<h2>8.1 Advantages</h2>

<table>
<thead><tr><th>#</th><th>Advantage</th><th>Impact</th></tr></thead>
<tbody>
<tr><td>1</td><td><strong>Zero API cost for scoring</strong></td><td>All ML inference runs client-side. No per-request charges. Cost savings scale linearly with user growth.</td></tr>
<tr><td>2</td><td><strong>Instant feedback (&lt;100ms)</strong></td><td>No network round-trip for scoring. Users get immediate results after recording. Feels responsive and game-like.</td></tr>
<tr><td>3</td><td><strong>Works offline</strong></td><td>After initial model download (~8MB), scoring works without internet. Critical for workshops, classrooms, and areas with poor connectivity.</td></tr>
<tr><td>4</td><td><strong>Deterministic and reproducible</strong></td><td>Same input always produces same score. Enables meaningful progress tracking over time.</td></tr>
<tr><td>5</td><td><strong>Privacy-preserving</strong></td><td>No video data leaves the user's device for scoring. Compliant with strict data protection requirements.</td></tr>
<tr><td>6</td><td><strong>Unlimited concurrent users</strong></td><td>Each user's browser does its own computation. No server-side bottleneck or rate limiting.</td></tr>
<tr><td>7</td><td><strong>52 blendshapes = granular analysis</strong></td><td>ARKit-compatible blendshapes capture fine-grained facial movements (individual eyebrows, lip corners, nose wrinkle, cheek puff).</td></tr>
</tbody>
</table>

<h2>8.2 Limitations</h2>

<table>
<thead><tr><th>#</th><th>Limitation</th><th>Mitigation</th></tr></thead>
<tbody>
<tr><td>1</td><td><strong>No audio/tone analysis</strong></td><td>Vocal pacing skill relies on mouth movement patterns (jawOpen, mouthFunnel) as proxy. OpenAI Whisper available for actual audio transcription in separate flow.</td></tr>
<tr><td>2</td><td><strong>Requires modern browser + WebGL</strong></td><td>Graceful error handling in useMediaPipe hook. Clear error message: "Please use a modern browser with WebGL support."</td></tr>
<tr><td>3</td><td><strong>~8MB model download on first visit</strong></td><td>Browser caches models after first download. Loading state shown during initialization.</td></tr>
<tr><td>4</td><td><strong>Less nuanced than GPT-4o Vision for complex social cues</strong></td><td>MediaPipe measures muscle activation, not intent or context. GPT-4o TEXT coaching compensates with contextual advice.</td></tr>
<tr><td>5</td><td><strong>Blendshape accuracy varies by lighting/angle</strong></td><td>Minimum confidence thresholds (0.5) filter low-quality detections. Only frames with <code>faceDetected: true</code> are scored.</td></tr>
<tr><td>6</td><td><strong>Pose limited to upper body</strong></td><td>Only 11 of 33 landmarks extracted (head to hips). Sufficient for communication coaching but not full-body dance/martial arts.</td></tr>
<tr><td>7</td><td><strong>Single-person only</strong></td><td>numFaces: 1, numPoses: 1. Multi-person interaction coaching not supported.</td></tr>
</tbody>
</table>
`,
},

// ── Chapter 9: Alignment with Vision ────────────────────────────────────────
{
  title: 'Alignment with seeneyu Vision',
  desc: 'How MediaPipe serves the mission',
  content: `
<h1>9. Alignment with seeneyu Vision &amp; Mission</h1>

<blockquote>
<strong>seeneyu's mission:</strong> Democratize body language coaching by making world-class communication training accessible, affordable, and private — for anyone with a browser and a webcam.
</blockquote>

<h2>9.1 Accessible</h2>
<p>MediaPipe runs in any modern browser — no app install, no special hardware, no GPU server. A student in rural Vietnam with a $200 laptop and a webcam can practice the same exercises as a corporate executive with a $3000 MacBook. The ~8MB model download is a one-time cost, cached by the browser.</p>

<h2>9.2 Affordable</h2>
<p>Zero marginal cost per scoring means seeneyu can offer generous free tiers without bleeding money. The Explorer (free) tier provides real AI-powered coaching, not a crippled demo. This aligns with the 3-tier monetization strategy: users upgrade for more content and recording time, not for basic functionality.</p>

<h2>9.3 Private</h2>
<p>No video data leaves the device for scoring. Users can practice embarrassing expressions, work on insecurities, and experiment freely — knowing their recordings are analyzed locally and only the numerical results reach the server. This is especially important for:</p>
<ul>
<li><strong>Education:</strong> Student privacy regulations (FERPA, GDPR)</li>
<li><strong>Enterprise:</strong> Corporate training where video leakage is unacceptable</li>
<li><strong>Personal:</strong> Users practicing vulnerable social skills</li>
</ul>

<h2>9.4 The Core Loop, Supercharged</h2>
<p>MediaPipe transforms the Watch → Observe → Mimic → Feedback → Repeat loop from a slow, expensive cycle into a fast, free one:</p>

<table>
<thead><tr><th>Loop Step</th><th>Before (GPT-4o Vision)</th><th>After (MediaPipe)</th></tr></thead>
<tbody>
<tr><td>Watch</td><td>YouTube clip</td><td>YouTube clip (unchanged)</td></tr>
<tr><td>Observe</td><td>Observation guide</td><td>Observation guide (unchanged)</td></tr>
<tr><td>Mimic</td><td>Record + upload frames</td><td>Record + analyze locally</td></tr>
<tr><td>Feedback</td><td>Wait 3-8s for API → score</td><td>Instant score (&lt;100ms)</td></tr>
<tr><td>Repeat</td><td>$0.03 per attempt → hesitate</td><td>$0.00 per attempt → freely retry</td></tr>
</tbody>
</table>

<p>The instant, free feedback loop encourages <strong>more practice attempts per session</strong>, which is the single strongest predictor of skill improvement in deliberate practice research.</p>

<h2>9.5 Future Directions</h2>
<ul>
<li><strong>Hand gesture tracking:</strong> MediaPipe HandLandmarker (21 landmarks per hand) for gesture coaching</li>
<li><strong>Multi-person:</strong> Raise numFaces/numPoses for conversation practice between two people</li>
<li><strong>Temporal patterns:</strong> Sequence analysis (expression transitions over time, not just snapshots)</li>
<li><strong>Audio integration:</strong> Combine MediaPipe visual data with Whisper transcripts for holistic communication scoring</li>
<li><strong>On-device model fine-tuning:</strong> WebNN API (emerging) could enable personalized models that adapt to each user's baseline expressions</li>
</ul>
`,
},

]; // end chapters

// ─── HTML Template ──────────────────────────────────────────────────────────

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const tocRows = chapters.map((ch, i) => {
  const num = String(i + 1).padStart(2, '0');
  return `<div class="toc-row"><span class="toc-num">${num}</span><span class="toc-title">${ch.title}</span><span class="toc-dots"></span><span class="toc-desc">${ch.desc}</span></div>`;
}).join('\n');

const chapterSections = chapters.map(ch =>
  `<section class="doc-section">${ch.content}</section>`
).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MediaPipe Technical Architecture — seeneyu</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 10pt;
    color: #1e293b;
    line-height: 1.65;
  }

  /* ── Cover ── */
  .cover {
    width: 100%;
    height: 100vh;
    background: linear-gradient(140deg, #0d0d14 0%, #1a1033 40%, #2d1b69 70%, #4a1d96 100%);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 80px 90px;
    page-break-after: always;
    color: #fff;
  }
  .cover .badge {
    background: rgba(245,158,11,0.15);
    border: 1px solid rgba(245,158,11,0.4);
    border-radius: 4px;
    padding: 5px 14px;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #fbbf24;
    margin-bottom: 32px;
  }
  .cover h1 {
    font-size: 36pt;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 14px;
    letter-spacing: -0.03em;
  }
  .cover h1 .accent { color: #f59e0b; }
  .cover .subtitle {
    font-size: 13pt;
    color: #a5b4c8;
    margin-bottom: 56px;
    max-width: 520px;
    line-height: 1.5;
  }
  .cover .divider {
    width: 56px; height: 3px;
    background: linear-gradient(90deg, #f59e0b, transparent);
    margin-bottom: 36px; border-radius: 2px;
  }
  .cover .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px 56px;
  }
  .cover .meta-item strong {
    display: block; font-size: 7.5pt;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #f59e0b; margin-bottom: 3px;
  }
  .cover .meta-item { font-size: 9.5pt; color: #cbd5e1; }

  /* ── TOC ── */
  .toc-page {
    padding: 72px 90px;
    page-break-after: always;
  }
  .toc-page h2 {
    font-size: 24pt; font-weight: 800;
    color: #0f172a; margin-bottom: 6px;
    border: none; padding: 0;
  }
  .toc-date { font-size: 9pt; color: #94a3b8; margin-bottom: 44px; }
  .toc-row {
    display: flex; align-items: baseline;
    padding: 7px 0; border-bottom: 1px solid #f1f5f9;
  }
  .toc-num {
    font-size: 8pt; font-weight: 700; font-family: monospace;
    color: #d97706; width: 30px; flex-shrink: 0;
  }
  .toc-title { flex: 1; font-size: 10pt; color: #334155; font-weight: 500; }
  .toc-dots {
    flex: 1; border-bottom: 1.5px dotted #e2e8f0;
    margin: 0 14px; position: relative; top: -3px;
  }
  .toc-desc { font-size: 8.5pt; color: #94a3b8; max-width: 260px; text-align: right; }

  /* ── Sections ── */
  .doc-section {
    padding: 52px 90px 44px;
    page-break-before: always;
  }

  /* ── Typography ── */
  h1 {
    font-size: 22pt; font-weight: 800;
    color: #0f172a; line-height: 1.1;
    margin-bottom: 14px; letter-spacing: -0.02em;
    padding-bottom: 12px;
    border-bottom: 3px solid #d97706;
  }
  h2 {
    font-size: 14pt; font-weight: 700;
    color: #0f172a; margin: 32px 0 10px;
    padding-bottom: 6px;
    border-bottom: 1.5px solid #e2e8f0;
  }
  h3 {
    font-size: 11pt; font-weight: 600;
    color: #1e293b; margin: 22px 0 8px;
  }

  p { margin: 8px 0; }
  strong { font-weight: 600; color: #0f172a; }
  em { font-style: italic; color: #64748b; }

  /* ── Code ── */
  code {
    font-family: 'Cascadia Code', 'Fira Code', 'Courier New', monospace;
    font-size: 8pt;
    background: #f1f5f9;
    color: #92400e;
    padding: 1px 5px;
    border-radius: 3px;
  }
  pre {
    background: #0f172a;
    border-radius: 6px;
    padding: 14px 18px;
    margin: 14px 0;
    border-left: 3px solid #d97706;
    overflow: hidden;
  }
  pre code {
    font-family: 'Cascadia Code', 'Fira Code', 'Courier New', monospace;
    font-size: 7.5pt;
    background: transparent;
    color: #e2e8f0;
    padding: 0;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.65;
  }

  /* ── Tables ── */
  table {
    width: 100%; border-collapse: collapse;
    margin: 14px 0; font-size: 8.5pt;
  }
  thead tr { background: #0f172a; }
  thead th {
    padding: 8px 12px; text-align: left;
    font-weight: 600; font-size: 8pt;
    letter-spacing: 0.04em; color: #f8fafc;
  }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  td { padding: 7px 12px; vertical-align: top; }
  td code { font-size: 7.5pt; }

  /* ── Lists ── */
  ul, ol { margin: 8px 0 8px 22px; }
  li { margin: 3px 0; }

  /* ── Blockquote ── */
  blockquote {
    border-left: 3px solid #d97706;
    background: #fffbeb;
    padding: 10px 16px; margin: 12px 0;
    border-radius: 0 4px 4px 0;
    font-size: 9.5pt; color: #475569;
  }

  @page { size: A4; margin: 0; }
</style>
</head>
<body>

<div class="cover">
  <div class="badge">Technical Architecture</div>
  <h1><span class="accent">MediaPipe</span> in seeneyu</h1>
  <p class="subtitle">How seeneyu Delivers Real-Time Body Language Analysis<br/>Client-Side ML Pipeline &middot; Zero API Cost &middot; Instant Feedback</p>
  <div class="divider"></div>
  <div class="meta-grid">
    <div class="meta-item"><strong>Version</strong>1.0 &mdash; April 2026</div>
    <div class="meta-item"><strong>Status</strong>Production</div>
    <div class="meta-item"><strong>Branch</strong>master</div>
    <div class="meta-item"><strong>Models</strong>FaceLandmarker + PoseLandmarker</div>
    <div class="meta-item"><strong>Migration</strong>Commit b56564b (2026-03-25)</div>
    <div class="meta-item"><strong>Live</strong>seeneyu.vercel.app</div>
  </div>
</div>

<div class="toc-page">
  <h2>Table of Contents</h2>
  <p class="toc-date">MediaPipe Technical Architecture &middot; ${today} &middot; 9 Chapters &middot; 13 Source Files</p>
  ${tocRows}
</div>

${chapterSections}

</body>
</html>`;

// ─── Generate PDF ───────────────────────────────────────────────────────────

const htmlPath = path.join(__dirname, '_output.html');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML generated.');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const outputPath = path.join(__dirname, '..', 'mediapipe-architecture.pdf');

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '24px', right: '0', bottom: '24px', left: '0' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="width:100%;font-family:'Segoe UI',sans-serif;font-size:7pt;color:#94a3b8;padding:6px 90px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-weight:600;color:#d97706;">seeneyu</span>
      <span>MediaPipe Technical Architecture &middot; April 2026</span>
    </div>`,
    footerTemplate: `<div style="width:100%;font-family:'Segoe UI',sans-serif;font-size:7pt;color:#94a3b8;padding:6px 90px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;">
      <span>Confidential &mdash; Internal Use Only</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`,
  });

  await browser.close();
  fs.unlinkSync(htmlPath);

  const size = fs.statSync(outputPath).size;
  console.log(`\n  PDF: ${outputPath}`);
  console.log(`    Size: ${(size / 1024).toFixed(0)} KB`);
})();
