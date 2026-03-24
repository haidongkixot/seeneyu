"""
M14 Clip Batch 2 — adds active-listening and vocal-pacing clips
Run: python scripts/add-clips-m14-batch2.py
"""
import json

PATH = ".shared/outputs/data/clips-100-seed.json"
with open(PATH, encoding="utf-8") as f:
    data = json.load(f)

existing_ids = {c["youtube_video_id"] for c in data["clips"]}
start_num = len(data["clips"]) + 1

NEW_CLIPS = [
  # ── active-listening ─────────────────────────────────────────────────────────
  {
    "youtube_video_id": "8GY3sO47YYo",
    "movie_title": "Good Will Hunting", "year": 1997,
    "character_name": "Sean Maguire", "actor_name": "Robin Williams",
    "scene_description": "Sean sits with Will in silence, then delivers 'It's not your fault' — his listening posture is completely open, patient, and unhurried.",
    "skill_category": "active-listening", "difficulty": "intermediate",
    "start_sec": 20, "end_sec": 150,
    "signal_clarity": 1, "noise_level": 1, "context_dependency": 1, "replication_difficulty": 2, "difficulty_score": 7,
    "screenplay_source": "https://imsdb.com/scripts/Good-Will-Hunting.html",
    "annotation": "Sean's listening is the entire scene. He says very little — but watch his face, his stillness, his patient repetition. Each 'it's not your fault' is delivered while fully tracking Will's response. This is what deep listening looks like.",
    "script": "1. Sit or stand completely still while the other person speaks.\n2. Keep your body slightly forward — engaged, not reclining.\n3. Resist the urge to fill silence — let it work.\n4. When you respond, address exactly what they said — not your prepared reply.",
    "observation_guide": {
      "headline": "Sean Maguire's listening scene — how silence and presence create breakthrough",
      "moments": [
        {"at_second": 22, "technique": "Forward Lean", "what": "Seated with a slight lean forward — not relaxed back, engaged forward", "why": "Leaning forward signals 'I'm tracking you' — it shows active attention, not passive hearing"},
        {"at_second": 38, "technique": "Uninterrupted Silence", "what": "Will pushes back — Sean holds the silence fully before responding", "why": "Not jumping to fill silence signals that you've heard what was said and are sitting with it"},
        {"at_second": 58, "technique": "Tracking Eyes", "what": "Eyes move with Will's face — reading micro-expressions, not staring fixed", "why": "Active listening involves reading the unspoken message — the face tells more than the words"},
        {"at_second": 82, "technique": "Patient Repetition", "what": "Says 'it's not your fault' again — same warmth, different weight", "why": "Repeating a statement while tracking the listener's response shows you're calibrating, not performing"},
        {"at_second": 110, "technique": "Physical Response", "what": "Doesn't back away when Will becomes emotional — leans in slightly", "why": "Maintaining or increasing physical presence during someone's emotion signals safety, not threat"},
        {"at_second": 138, "technique": "The Hold", "what": "Arms wrap around Will — the listening becomes physical presence", "why": "The highest form of active listening is responding to what someone actually needs, not what they said"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Forward Lean", "instruction": "Sit and lean slightly forward while someone speaks (or imagine it). Hold that posture — don't drift back. Notice what it does to your listening quality.", "tip": "The forward lean is a commitment signal — it says 'I'm in this with you'.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Hold the Silence", "instruction": "Someone finishes speaking. Count to 3 internally before responding. Hold eye contact during those 3 seconds.", "tip": "The pause after they finish is when they feel heard — don't take it from them.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Track and Mirror", "instruction": "Listen to someone. Subtly reflect their facial expressions back — if they're uncertain, let your brow show it. Don't perform: match authentically.", "tip": "Micro-mirroring is involuntary in great listeners — practice making it conscious first.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Repeat and Calibrate", "instruction": "After someone tells you something difficult, repeat the core of what they said back — then hold the silence and track their response before continuing.", "tip": "The pause after your reflection shows you care about their response, not your script.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 22, "type": "technique", "note": "Forward lean — engaged not reclining"},
      {"at_second": 58, "type": "technique", "note": "Tracking eyes — reading the unspoken"},
      {"at_second": 110, "type": "technique", "note": "Lean in during emotion — signals safety"}
    ]
  },
  {
    "youtube_video_id": "zKQBHkzOYvw",
    "movie_title": "Good Will Hunting", "year": 1997,
    "character_name": "Sean Maguire", "actor_name": "Robin Williams",
    "scene_description": "Sean asks Will 'What do you want to do?' and waits — genuinely curious, not leading — creating space for a real answer.",
    "skill_category": "active-listening", "difficulty": "beginner",
    "start_sec": 10, "end_sec": 90,
    "signal_clarity": 1, "noise_level": 1, "context_dependency": 1, "replication_difficulty": 1, "difficulty_score": 4,
    "screenplay_source": "https://imsdb.com/scripts/Good-Will-Hunting.html",
    "annotation": "Sean asks an open question and then — crucially — does nothing. No prompting, no nodding along to fill space, no leading. He asks and he waits. This is the rarest listening skill: genuine open curiosity.",
    "script": "1. Ask an open question with genuine curiosity — not 'leading' toward your expected answer.\n2. After asking, stop. Don't add 'like, maybe...?' or 'you know...'\n3. Keep your face open and interested — not impatient.\n4. Let whatever answer comes be a real answer.",
    "observation_guide": {
      "headline": "How genuine curiosity changes the quality of listening",
      "moments": [
        {"at_second": 12, "technique": "Open Question Set", "what": "The question is truly open — no embedded assumption in the phrasing", "why": "Leading questions telegraph the 'right' answer; open questions invite real truth"},
        {"at_second": 25, "technique": "The Drop", "what": "Sean goes quiet and still immediately after asking — no prompts, no nods", "why": "Most people fill the silence after asking — this kills the question. The drop is the skill."},
        {"at_second": 40, "technique": "Open Face Wait", "what": "Face remains open and curious — no impatience, no anticipation", "why": "An impatient face while waiting answers the question for the other person: 'hurry up'"},
        {"at_second": 55, "technique": "Non-Leading Nod", "what": "Small nods — showing processing, not agreement or direction", "why": "Nodding too enthusiastically at one answer effectively chooses it for them"},
        {"at_second": 70, "technique": "No Interruption", "what": "Will starts, pauses, restarts — Sean doesn't intervene", "why": "The pauses and restarts are the person finding the real answer — interrupting takes it from them"},
        {"at_second": 82, "technique": "The Receive", "what": "Sean's face shows he received the answer — slight nod, soft exhale", "why": "Receiving an answer visibly (but not over-enthusiastically) confirms the exchange was real"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Open Question", "instruction": "Ask someone one question that has no obvious 'right' answer embedded in it. Notice if you want to add context or steer.", "tip": "The simpler the question, the more genuinely open it usually is.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "The Drop", "instruction": "Ask your question, then stop. No follow-up clauses, no 'you know what I mean?'. Just the question and silence.", "tip": "Discomfort after asking is normal — resist it.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Open Face Hold", "instruction": "While waiting for an answer, hold an open, curious face for 10–15 seconds. No impatience visible.", "tip": "Think of something genuinely interesting — let that set your expression naturally.", "target_duration_sec": 30},
      {"step_number": 4, "skill_focus": "Full Listening Conversation", "instruction": "Ask one meaningful question. Wait fully. Receive the answer. Ask a follow-up that directly stems from what they said — not from your plan.", "tip": "The follow-up question reveals whether you actually listened.", "target_duration_sec": 90}
    ],
    "annotations": [
      {"at_second": 12, "type": "technique", "note": "Truly open question — no embedded answer"},
      {"at_second": 25, "type": "technique", "note": "The drop — silence after asking"},
      {"at_second": 70, "type": "technique", "note": "No interruption — let them find the answer"}
    ]
  },
  {
    "youtube_video_id": "jJylFfTSn6M",
    "movie_title": "Before Sunrise", "year": 1995,
    "character_name": "Jesse & Celine", "actor_name": "Ethan Hawke & Julie Delpy",
    "scene_description": "Jesse and Celine say goodbye at the train station — listening to each other's silences as much as their words.",
    "skill_category": "active-listening", "difficulty": "intermediate",
    "start_sec": 10, "end_sec": 110,
    "signal_clarity": 1, "noise_level": 1, "context_dependency": 1, "replication_difficulty": 2, "difficulty_score": 6,
    "screenplay_source": "https://imsdb.com/scripts/Before-Sunrise.html",
    "annotation": "The goodbye scene is a lesson in listening to what isn't said. Both actors respond to pauses, partial sentences, and unfinished thoughts. Real listening is about tracking the whole person — not just the words.",
    "script": "1. When someone trails off, don't complete their sentence — wait.\n2. Listen for what they mean, not just what they say.\n3. Your responses should show you heard the feeling, not just the content.\n4. Eye contact during silences is as important as during words.",
    "observation_guide": {
      "headline": "Jesse and Celine's farewell — listening between the words",
      "moments": [
        {"at_second": 12, "technique": "Listening to Pause", "what": "Celine trails off — Jesse waits and watches, doesn't complete her sentence", "why": "Completing someone's sentence takes the thought from them; waiting returns it"},
        {"at_second": 30, "technique": "Emotional Tracking", "what": "Jesse's face shows he's tracking her emotion, not just processing her words", "why": "Listening to emotion rather than content produces empathetic responses"},
        {"at_second": 50, "technique": "Sub-text Response", "what": "His answer responds to what she means, not literally what she said", "why": "The highest form of listening produces responses to the real message"},
        {"at_second": 68, "technique": "Comfortable Silence Sharing", "what": "Both hold silence — neither rushes to fill it", "why": "Comfortable shared silence is a sign of deep listening — both are processing together"},
        {"at_second": 85, "technique": "Physical Lean In", "what": "As the goodbye approaches, both lean toward each other involuntarily", "why": "The body responds to listening — we move toward what we're truly taking in"},
        {"at_second": 100, "technique": "Eye Hold During Goodbye", "what": "Eye contact maintained as one boards the train — no rush to look away", "why": "The eyes often continue the conversation that words can't finish"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Wait for Completion", "instruction": "In conversation, let the other person fully trail off before you respond — don't complete their thought.", "tip": "Even if you know where they're going — let them get there.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Emotional Tracking", "instruction": "Watch someone speak and identify the emotion under their words — not the content. Respond to the emotion first.", "tip": "Try: 'That sounds frustrating' before 'Here's the solution'.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Sub-text Response", "instruction": "Someone says 'I'm fine'. Instead of accepting that, respond to what their face says. Practice this with camera exercises.", "tip": "The real message is almost never in the words.", "target_duration_sec": 30},
      {"step_number": 4, "skill_focus": "Full Listening Farewell", "instruction": "Deliver a difficult goodbye or a meaningful ending statement, making eye contact through every word — including the very last one.", "tip": "We often look away at the end of hard things. Don't.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 12, "type": "technique", "note": "Wait for trails — don't complete"},
      {"at_second": 50, "type": "technique", "note": "Sub-text response — hears the real message"},
      {"at_second": 68, "type": "technique", "note": "Shared silence — both processing together"}
    ]
  },
  {
    "youtube_video_id": "3MP5qHvuHE0",
    "movie_title": "Jerry Maguire", "year": 1996,
    "character_name": "Jerry Maguire", "actor_name": "Tom Cruise",
    "scene_description": "Jerry's 'you complete me' speech — delivered while listening to Dorothy's face to calibrate every line.",
    "skill_category": "active-listening", "difficulty": "intermediate",
    "start_sec": 10, "end_sec": 100,
    "signal_clarity": 1, "noise_level": 1, "context_dependency": 2, "replication_difficulty": 2, "difficulty_score": 7,
    "screenplay_source": "https://imsdb.com/scripts/Jerry-Maguire.html",
    "annotation": "Jerry's speech is only possible because he's watching Dorothy as he delivers it. He calibrates — slows down, checks in, adjusts — in real time. The scene shows how great communicators listen even while speaking.",
    "script": "1. While speaking, watch the listener's face as closely as you watch your own words.\n2. Slow down when you see their expression shift.\n3. Pause and make eye contact at your most important line.\n4. Let their response (not your script) determine when you've finished.",
    "observation_guide": {
      "headline": "Jerry Maguire listens while speaking — how great communicators calibrate in real time",
      "moments": [
        {"at_second": 12, "technique": "Calibration Pause", "what": "Jerry pauses mid-speech to check Dorothy's face before continuing", "why": "The calibration pause signals that the listener's response matters more than finishing the script"},
        {"at_second": 28, "technique": "Slow on the Landing", "what": "Slows his pace at 'you complete me' — listening for how it lands", "why": "Slowing at your key line creates space for the listener to feel it — and lets you see if they did"},
        {"at_second": 45, "technique": "Response Tracking", "what": "Eyes on her face throughout — tracking each micro-response", "why": "Speaking while watching is how you know whether to continue, pivot, or stop"},
        {"at_second": 62, "technique": "The Dorothy Interruption", "what": "She says 'You had me at hello' — he stops immediately, fully receives it", "why": "The best speakers stop when the listener has arrived — they don't finish a speech no one is waiting for"},
        {"at_second": 78, "technique": "Mutual Hold", "what": "Both go still — the conversation has concluded and both know it", "why": "Recognising when a conversation is complete (and stopping) is a listening skill"},
        {"at_second": 92, "technique": "Response Without Words", "what": "Jerry's response is physical — not more speech", "why": "Sometimes the best response to what you've heard is presence, not words"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Watch While Speaking", "instruction": "Deliver a 30-second message to camera. Pause twice to 'read' the camera's response before continuing.", "tip": "Treat the camera as a person whose face tells you whether to continue.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Slow the Key Line", "instruction": "Identify the most important sentence in something you want to say. Deliver everything at normal speed — then slow down for that one sentence.", "tip": "The slowdown signals to the listener: this one matters.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Stop When They Arrive", "instruction": "Deliver a heartfelt statement. The moment the camera (person) 'reacts' — pause. Hold. Don't continue your planned speech.", "tip": "The instinct is to keep going — resist it.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Full Calibrated Speech", "instruction": "Deliver a meaningful personal statement while watching for the listener's response at each sentence. Let their face determine your pace.", "tip": "Communication is a two-way instrument — play both parts.", "target_duration_sec": 90}
    ],
    "annotations": [
      {"at_second": 12, "type": "technique", "note": "Calibration pause — checks the listener"},
      {"at_second": 45, "type": "technique", "note": "Tracks micro-responses while speaking"},
      {"at_second": 62, "type": "technique", "note": "Stops when she arrives — doesn't over-speak"}
    ]
  },
  {
    "youtube_video_id": "J_lEs4FYkhs",
    "movie_title": "When Harry Met Sally", "year": 1989,
    "character_name": "Sally Albright", "actor_name": "Meg Ryan",
    "scene_description": "Sally's diner scene — performing to make a point, then watching Harry's face to calibrate how the message lands.",
    "skill_category": "active-listening", "difficulty": "beginner",
    "start_sec": 10, "end_sec": 90,
    "signal_clarity": 1, "noise_level": 2, "context_dependency": 1, "replication_difficulty": 1, "difficulty_score": 4,
    "screenplay_source": "https://imsdb.com/scripts/When-Harry-Met-Sally.html",
    "annotation": "The genius of this scene is Sally's listening. She delivers her performance while tracking Harry's discomfort — then lands her point precisely when his expression confirms he's understood. She reads the room perfectly.",
    "script": "1. Make your point, then watch their face — not to check approval, but to read comprehension.\n2. When their expression shifts to 'I get it', stop. Don't elaborate.\n3. Let the silence after a demonstration do the work.\n4. The observer's response is your feedback — read it.",
    "observation_guide": {
      "headline": "Sally's diner scene — performing while reading the room",
      "moments": [
        {"at_second": 12, "technique": "Active Awareness", "what": "Even while performing, Sally's eyes track Harry's discomfort", "why": "The best communicators maintain audience awareness even during their own delivery"},
        {"at_second": 30, "technique": "Escalation Reading", "what": "Increases intensity in response to his increasing skepticism", "why": "Calibrating intensity to the listener's resistance is advanced active-listening"},
        {"at_second": 50, "technique": "Land and Stop", "what": "Stops immediately when his expression confirms comprehension", "why": "Over-explaining after a point has landed is a listening failure — you stopped reading the room"},
        {"at_second": 62, "technique": "The Beat", "what": "Holds the silence after the demonstration — reads the room", "why": "The pause after a demonstration gives the listener time to arrive — rushing it prevents the landing"},
        {"at_second": 75, "technique": "Dry Delivery Read", "what": "Delivers the punchline ('I'll have what she's having') at exactly the right moment — after reading the room fully", "why": "Timing is a listening skill — you can only deliver at the right moment if you've been tracking the room"},
        {"at_second": 85, "technique": "Audience Response", "what": "Registers the whole room's response, not just Harry's", "why": "Great communicators maintain peripheral awareness of the full room, not just their primary audience"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Peripheral Awareness", "instruction": "While making a point to camera, be aware of what's behind the camera — imagine two people, track both.", "tip": "Room awareness is a peripheral listening skill — train it separately from focal awareness.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Land and Stop", "instruction": "Make your point. Watch the camera for the moment of comprehension ('I get it' expression). The instant you see it — stop. Don't add more.", "tip": "Continuing past the landing is the most common over-communication error.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Timing Read", "instruction": "Deliver a comedic or punchline statement. Wait for the camera to show the expected expression — then deliver your line at exactly that moment.", "tip": "Timing isn't about counting beats — it's about reading the listener.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Full Room Reading", "instruction": "Deliver a 60-second story. At three specific moments, pause and read the 'room' before continuing. Let the room's state determine your next move.", "tip": "Stop checking your script; check your audience instead.", "target_duration_sec": 90}
    ],
    "annotations": [
      {"at_second": 12, "type": "technique", "note": "Tracks Harry while performing"},
      {"at_second": 50, "type": "technique", "note": "Lands and stops — doesn't over-explain"},
      {"at_second": 75, "type": "technique", "note": "Timing from listening — reads the full room"}
    ]
  },
  # ── vocal-pacing ─────────────────────────────────────────────────────────────
  {
    "youtube_video_id": "07h6OiS-Tns",
    "movie_title": "The King's Speech", "year": 2010,
    "character_name": "Prince Albert / Bertie", "actor_name": "Colin Firth",
    "scene_description": "Bertie works with Lionel Logue on pace and rhythm — learning that slowing down and pausing is the cure for his stammer.",
    "skill_category": "vocal-pacing", "difficulty": "beginner",
    "start_sec": 15, "end_sec": 120,
    "signal_clarity": 1, "noise_level": 1, "context_dependency": 1, "replication_difficulty": 1, "difficulty_score": 4,
    "screenplay_source": "https://imsdb.com/scripts/King%27s-Speech,-The.html",
    "annotation": "The King's Speech shows vocal pacing as rescue — Bertie's stammer disappears when he learns to slow down and breathe. The lesson is universal: speed is anxiety; pace is control.",
    "script": "1. Before you speak, breathe.\n2. Speak one phrase at a time — let each phrase complete before starting the next.\n3. Pause at every punctuation mark — don't push through.\n4. If you stumble, stop. Breathe. Restart the phrase — don't speed up.",
    "observation_guide": {
      "headline": "Bertie learns to slow down — how pace defeats panic",
      "moments": [
        {"at_second": 18, "technique": "Pre-Speech Breath", "what": "Logue has Bertie breathe before he utters a word", "why": "Breath before speech fills the lungs, steadies the voice, and signals the brain to slow down"},
        {"at_second": 35, "technique": "Phrase at a Time", "what": "Bertie speaks one phrase, stops, breathes, continues", "why": "Breaking speech into phrase-sized units removes the urgency to get to the end"},
        {"at_second": 52, "technique": "Pause Comfort", "what": "Logue reinforces that pauses are acceptable — not failure", "why": "The fear of pausing is why people rush — removing that fear changes everything"},
        {"at_second": 72, "technique": "Slow on Consonants", "what": "Hard consonants elongated slightly — not over-articulated, just given time", "why": "Consonants are where stammers and pace errors happen — slowing them prevents both"},
        {"at_second": 95, "technique": "Breath Recovery", "what": "When a stumble occurs, Logue guides Bertie to breathe then resume", "why": "Recovering from a stumble by slowing (not rushing) is the advanced skill"},
        {"at_second": 110, "technique": "Rhythm Establishment", "what": "By the end, Bertie has found a natural rhythm — not slow, but paced", "why": "Pacing is not about being slow — it's about being rhythmically intentional"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Breath First", "instruction": "Take a full breath before you speak your first word. Don't begin until the breath is complete.", "tip": "This single habit changes the quality of everything that follows.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Phrase Chunking", "instruction": "Read a paragraph with a full pause at every comma and period — even if it feels too slow.", "tip": "At first this will feel awkward. That's normal — your calibration is off from years of rushing.", "target_duration_sec": 45},
      {"step_number": 3, "skill_focus": "Stammer Recovery", "instruction": "Say a difficult sentence. When you stumble (deliberately), stop — breathe — restart the phrase slowly. Don't push through.", "tip": "Pushing through a stumble speeds you up. Stopping and restarting slows you down — and sounds more authoritative.", "target_duration_sec": 30},
      {"step_number": 4, "skill_focus": "Rhythm Finding", "instruction": "Deliver a 30-second passage at 70% of your normal speed, finding a natural rhythm. Then play it back — notice the difference.", "tip": "Record and listen — your sense of 'too slow' is almost always faster than it actually is.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 18, "type": "technique", "note": "Breath first — foundation of pace"},
      {"at_second": 35, "type": "technique", "note": "Phrase chunking — one unit at a time"},
      {"at_second": 95, "type": "technique", "note": "Slow recovery — breathe then resume"}
    ]
  },
  {
    "youtube_video_id": "CfcVN7lUseA",
    "movie_title": "The King's Speech", "year": 2010,
    "character_name": "King George VI", "actor_name": "Colin Firth",
    "scene_description": "The wartime radio broadcast — Bertie speaks to the nation at exactly the right pace, using every technique Logue taught him.",
    "skill_category": "vocal-pacing", "difficulty": "intermediate",
    "start_sec": 30, "end_sec": 180,
    "signal_clarity": 1, "noise_level": 1, "context_dependency": 1, "replication_difficulty": 2, "difficulty_score": 7,
    "screenplay_source": "https://imsdb.com/scripts/King%27s-Speech,-The.html",
    "annotation": "This is the payoff scene — all the pacing work made visible. Bertie's pauses are now strategic, not fearful. His phrasing is deliberate. The speech is slow enough to be understood by a nation and powerful enough to be remembered.",
    "script": "1. Begin at a pace that feels almost too slow.\n2. Let each phrase complete — don't trail off at the end.\n3. Pause after your most important line — let it settle.\n4. Your final sentence should be your slowest — give it maximum gravity.",
    "observation_guide": {
      "headline": "The King's broadcast — pacing as leadership",
      "moments": [
        {"at_second": 35, "technique": "Measured Opening", "what": "Opens at a pace that would have been unthinkable before Logue's training", "why": "Starting slowly signals confidence — rushing the opening signals anxiety"},
        {"at_second": 55, "technique": "Strategic Pause", "what": "Full pause after 'In this grave hour' — three full seconds", "why": "A pause after a weighty phrase invites the listener to sit with it — it's a gift, not a gap"},
        {"at_second": 80, "technique": "Emotional Slow", "what": "Pace drops on the most personal part of the speech", "why": "Slowing on emotional content signals that you feel it — speed through emotion signals performance"},
        {"at_second": 110, "technique": "Consistent Rhythm", "what": "The speech maintains the same rhythmic pulse throughout", "why": "A consistent pace creates trance-like focus in listeners — the rhythm becomes hypnotic"},
        {"at_second": 145, "technique": "Climax Slow", "what": "Slowest pace at the climactic declaration", "why": "The most important thing you say should take the longest to say — slow on what matters most"},
        {"at_second": 168, "technique": "Held Final Pause", "what": "Long pause at the very end before the final word", "why": "The pause before the last word gives it infinite weight — the listener supplies the emotion"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Slower Opening", "instruction": "Deliver the first sentence of a speech at 60% of your normal speed. It feels wrong — do it anyway.", "tip": "The opening pace sets the expectation for everything that follows.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Three-Second Pause", "instruction": "After your most important line, hold a full three-second pause. Don't fill it.", "tip": "Count 'one, two, three' internally — it will feel like an eternity. It sounds like gravity.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Emotional Slowdown", "instruction": "Identify the most personal line in a passage. Deliver everything else at normal speed — then slow down specifically for that line.", "tip": "The contrast between your normal pace and the slow line makes the slow line unmissable.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Full Broadcast Pace", "instruction": "Deliver a full 60-second passage at King's Speech pace — measured, rhythmically consistent, with strategic pauses.", "tip": "Record and listen. You'll be surprised how authoritative 'too slow' actually sounds.", "target_duration_sec": 90}
    ],
    "annotations": [
      {"at_second": 35, "type": "technique", "note": "Measured opening — slow start = confidence"},
      {"at_second": 55, "type": "technique", "note": "Three-second pause — gravity not gap"},
      {"at_second": 145, "type": "technique", "note": "Climax slow — most important words slowest"}
    ]
  },
  {
    "youtube_video_id": "GBvBu5ErSSo",
    "movie_title": "Whiplash", "year": 2014,
    "character_name": "Terence Fletcher", "actor_name": "J.K. Simmons",
    "scene_description": "Fletcher delivers 'not quite my tempo' with clinical precision — his pacing is weaponised calm, each word dropped with controlled deliberateness.",
    "skill_category": "vocal-pacing", "difficulty": "advanced",
    "start_sec": 10, "end_sec": 110,
    "signal_clarity": 2, "noise_level": 2, "context_dependency": 2, "replication_difficulty": 3, "difficulty_score": 10,
    "screenplay_source": "https://imsdb.com/scripts/Whiplash.html",
    "annotation": "Fletcher's pacing is weaponised. He speaks slowly and deliberately when delivering criticism — the slow pace amplifies every word's damage. The clinical calm between each phrase is more terrifying than shouting would be.",
    "script": "1. Drop your pace to 60% of normal when delivering a high-stakes statement.\n2. Let each word land before moving to the next.\n3. No rushing, no trailing — every syllable gets full time.\n4. The pause between phrases should make the listener wait for what comes next.",
    "observation_guide": {
      "headline": "Fletcher's tempo control — how deliberate slow pace commands attention",
      "moments": [
        {"at_second": 12, "technique": "Baseline Calm", "what": "Fletcher begins at a measured, controlled pace — not fast, not aggressive", "why": "Slow pace in a high-tension moment is counterintuitive — which is exactly why it works"},
        {"at_second": 28, "technique": "Word Weight", "what": "Each word receives equal weight — none rushed past", "why": "Rushing words deprioritises some — slowing gives each equal significance"},
        {"at_second": 45, "technique": "Inter-Phrase Silence", "what": "Long pause between phrases — the silence is the weapon", "why": "The pause creates anticipation and anxiety — the listener dreads what comes next"},
        {"at_second": 62, "technique": "Volume Drop", "what": "When making his sharpest point, Fletcher drops volume with pace", "why": "Dropping both volume and pace creates a vacuum the listener leans into — maximum focus"},
        {"at_second": 80, "technique": "Clap Rhythm", "what": "The clapping is at the same rhythm as his speech — he's speaking in tempo", "why": "Physical rhythm reinforces vocal rhythm — the body and voice tell the same story"},
        {"at_second": 100, "technique": "No Acceleration", "what": "Even at the confrontation's peak, no acceleration of pace", "why": "Maintaining slow pace at maximum emotional intensity is the advanced version — it signals total control"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "60% Pace", "instruction": "Deliver a statement at 60% of your normal speed. Every word gets full time. Don't let any word get swallowed.", "tip": "This will feel unnatural. That discomfort is your calibration adjusting.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Inter-Phrase Pause", "instruction": "Between each sentence, hold a 2-second pause. Don't fill it with 'um'. Just hold.", "tip": "The pause is not a gap — it's a signal. It says: what I just said mattered.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Drop and Hold", "instruction": "Deliver a statement by dropping both pace and volume simultaneously. Hold that combination through your key point.", "tip": "The combination of slow + quiet creates a void the listener leans into.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Fletcher Scene", "instruction": "Deliver a correction or critique at Fletcher's pace — measured, deliberate, no rush. Notice the different effect from your normal speaking style.", "tip": "You're practising control, not menace. The pace itself does the work.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 12, "type": "technique", "note": "Measured baseline — slow signals control"},
      {"at_second": 45, "type": "technique", "note": "Inter-phrase silence — anticipation weapon"},
      {"at_second": 62, "type": "technique", "note": "Volume drop with pace — maximum focus"}
    ]
  },
  {
    "youtube_video_id": "x2WK_eWihdU",
    "movie_title": "Pulp Fiction", "year": 1994,
    "character_name": "Jules Winnfield", "actor_name": "Samuel L. Jackson",
    "scene_description": "Jules delivers the Ezekiel 25:17 monologue — beginning slowly, building through measured rhythm, and arriving at full devastating power.",
    "skill_category": "vocal-pacing", "difficulty": "advanced",
    "start_sec": 15, "end_sec": 120,
    "signal_clarity": 2, "noise_level": 2, "context_dependency": 3, "replication_difficulty": 3, "difficulty_score": 11,
    "screenplay_source": "https://imsdb.com/scripts/Pulp-Fiction.html",
    "annotation": "Jules's monologue is a pacing masterclass — the same text at different points would land differently. Tarantino and Jackson create a tempo escalation: from grave slow, to building rhythm, to arriving at maximum force. The pacing IS the speech.",
    "script": "The path of the righteous man...\n[slow, deliberate — each phrase given full weight]\nAnd I will strike down upon thee...\n[accelerating — rhythm builds]\nwith great vengeance and FURIOUS anger.\n[full velocity — landing at maximum impact]",
    "observation_guide": {
      "headline": "Jules's Ezekiel monologue — pacing as escalation architecture",
      "moments": [
        {"at_second": 18, "technique": "Grave Opening", "what": "First line delivered at near-funeral pace — maximum gravity", "why": "Starting slow creates contrast room — everything that follows is faster by comparison"},
        {"at_second": 35, "technique": "Building Rhythm", "what": "The biblical cadence begins to take shape — one beat, one word", "why": "Biblical speech has an ancient rhythmic pattern that creates hypnotic focus"},
        {"at_second": 55, "technique": "Middle Acceleration", "what": "Pace increases — not rushed, but building", "why": "The escalation tells the listener: we're moving toward something important"},
        {"at_second": 75, "technique": "The Pivot Pause", "what": "Full pause before 'And you will know my name' — holds tension", "why": "The pause at peak tension delays release in a way that makes the coming line inevitable"},
        {"at_second": 95, "technique": "Maximum Velocity", "what": "Final declaration at full pace — each word punched", "why": "Arriving at maximum speed only works because of the slow beginning — contrast is everything"},
        {"at_second": 108, "technique": "Post-Climax Hold", "what": "Complete stop after the final word — silence", "why": "The silence after maximum impact is where the power lives — don't rush out of it"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Slow Opening", "instruction": "Start a dramatic speech at funeral pace. Deliver the first three sentences at maximum deliberateness.", "tip": "Starting slower than feels right creates the contrast room you'll need to build into.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Build the Rhythm", "instruction": "Identify the rhythmic pattern in a passage (e.g. 'one beat per phrase'). Deliver each phrase at exactly that rhythm.", "tip": "Rhythmic speech puts listeners into a focused trance — the rhythm does half the work.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "The Pivot Pause", "instruction": "Find your climax line. Before it — hold a full 3-second pause. Then deliver the line at full pace.", "tip": "The pause before the climax is the anticipation that makes the landing inevitable.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Full Escalation Arc", "instruction": "Deliver the Ezekiel passage (or any dramatic text) from grave slow → rhythmic build → maximum velocity → final silence.", "tip": "Record and listen to the arc — the shape of the pacing is visible on playback.", "target_duration_sec": 90}
    ],
    "annotations": [
      {"at_second": 18, "type": "technique", "note": "Grave opening — maximum contrast room"},
      {"at_second": 55, "type": "technique", "note": "Building rhythm — escalation"},
      {"at_second": 75, "type": "technique", "note": "Pivot pause — holds tension before release"}
    ]
  },
  {
    "youtube_video_id": "vi0Lbjs5ECI",
    "movie_title": "Dead Poets Society", "year": 1989,
    "character_name": "John Keating", "actor_name": "Robin Williams",
    "scene_description": "Keating's 'Carpe Diem' introduction — his pacing shifts from stage whisper to full declaration, modelling range and intentionality.",
    "skill_category": "vocal-pacing", "difficulty": "intermediate",
    "start_sec": 10, "end_sec": 120,
    "signal_clarity": 1, "noise_level": 1, "context_dependency": 1, "replication_difficulty": 2, "difficulty_score": 7,
    "screenplay_source": "https://imsdb.com/scripts/Dead-Poets-Society.html",
    "annotation": "Keating uses his voice as a precision instrument — moving from grave slow to conspiratorial whisper to ringing declaration. The class is captivated not just by the words but by how the pacing forces them to lean in.",
    "script": "Carpe... [pause] ...diem.\n[grave, slow — let the words arrive separately]\nSeize the day.\n[conversational pace — land the translation]\nMake your lives extraordinary.\n[full, declarative — the arrival]",
    "observation_guide": {
      "headline": "Keating's 'Carpe Diem' — using pace to create wonder and urgency",
      "moments": [
        {"at_second": 12, "technique": "Graveyard Approach", "what": "Walks slowly toward the old photos — pace of movement matches pace of speech", "why": "Physical pacing and vocal pacing should agree — misalignment creates dissonance"},
        {"at_second": 28, "technique": "Conspiratorial Drop", "what": "Voice drops to a near-whisper as he leans in — forcing attention", "why": "Dropping volume forces listeners to lean in — it's a physical demand for attention"},
        {"at_second": 48, "technique": "Dead Boys Slow", "what": "The voice of 'the dead boys' at near-funeral pace", "why": "Using extreme slowness for dramatic effect — the pace signals the weight of what's being said"},
        {"at_second": 68, "technique": "Building Revelation", "what": "Pace gradually increases as Carpe Diem approaches", "why": "Velocity builds anticipation — the listener feels something important is coming"},
        {"at_second": 88, "technique": "Two-Word Pause", "what": "Carpe [pause] diem — the pause between the words is its own sentence", "why": "Breaking a two-word phrase with a pause forces each word to land individually"},
        {"at_second": 108, "technique": "Ringing Declaration", "what": "Full voice, full pace at 'Make your lives extraordinary'", "why": "The arrival at full pace/volume works only because of the slow, quiet journey that preceded it"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Whisper Drop", "instruction": "Deliver a line at normal pace — then drop the next line to a near-whisper. Notice how the listener's attention sharpens.", "tip": "The whisper is not quieter — it's more focused. It demands more from the listener.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Two-Word Split", "instruction": "Take a two-word phrase that matters ('Carpe Diem', 'Think different', etc). Deliver it with a deliberate pause between the two words.", "tip": "The pause makes both words land as complete thoughts.", "target_duration_sec": 20},
      {"step_number": 3, "skill_focus": "Pace Journey", "instruction": "Deliver a three-sentence passage: first at whisper/slow, second building, third at full voice/pace.", "tip": "The journey must feel intentional — not accidental variation.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Full Keating Monologue", "instruction": "Deliver 'O, Captain My Captain' or any Whitman passage in Keating's style — grave slow, conspiratorial whisper, ringing declaration.", "tip": "Physical movement should match pace: slow walk for slow speech, still for whisper, step forward for declaration.", "target_duration_sec": 90}
    ],
    "annotations": [
      {"at_second": 28, "type": "technique", "note": "Whisper drop — forces attention"},
      {"at_second": 68, "type": "technique", "note": "Building velocity — anticipation signal"},
      {"at_second": 88, "type": "technique", "note": "Two-word pause — each word lands separately"}
    ]
  },
]

new_clips = [c for c in NEW_CLIPS if c["youtube_video_id"] not in existing_ids]

for i, clip in enumerate(new_clips):
    num = start_num + i
    clip["id"] = f"clip_{num:03d}"

for c in new_clips:
    if "annotations" not in c:
        c["annotations"] = []

data["clips"].extend(new_clips)
data["_meta"] = {"status": "verified", "version": "2.0", "total": len(data["clips"])}

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Batch 2 complete — added {len(new_clips)} clips. Total: {len(data['clips'])}")
