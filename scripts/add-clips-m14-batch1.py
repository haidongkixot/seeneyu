"""
M14 Clip Batch 1 — adds clips 046–070 to clips-100-seed.json
Run: python scripts/add-clips-m14-batch1.py
"""
import json, os, sys

PATH = ".shared/outputs/data/clips-100-seed.json"
with open(PATH, encoding="utf-8") as f:
    data = json.load(f)

existing_ids = {c["youtube_video_id"] for c in data["clips"]}
start_num = len(data["clips"]) + 1

NEW_CLIPS = [
  # ── eye-contact ──────────────────────────────────────────────────────────────
  {
    "youtube_video_id": "VlSkPA60ujQ",
    "movie_title": "The Social Network", "year": 2010,
    "character_name": "Mark Zuckerberg", "actor_name": "Jesse Eisenberg",
    "scene_description": "Mark dissects his girlfriend Erica with rapid, surgical eye contact — shifting between cold clarity and dismissiveness before she breaks up with him.",
    "skill_category": "eye-contact", "difficulty": "advanced",
    "start_sec": 10, "end_sec": 130,
    "signal_clarity": 2, "noise_level": 2, "context_dependency": 2, "replication_difficulty": 3, "difficulty_score": 9,
    "screenplay_source": "https://imsdb.com/scripts/Social-Network,-The.html",
    "annotation": "Watch how Mark's eye contact oscillates between hyper-focused intensity and sudden vacancy. The unblinking stare signals dominance; the abrupt breaks signal contempt. Both are intentional and readable.",
    "script": "1. Hold direct eye contact while speaking — no looking away mid-thought.\n2. Let a beat of silence land before you respond.\n3. When you disagree, hold the gaze a half-second longer than comfortable.\n4. Avoid scanning the room — every eye movement is a signal.",
    "context_note": "Advanced: the pattern here (dominance through unbreaking gaze) can read as aggressive in lower-stakes contexts.",
    "observation_guide": {
      "headline": "How Zuckerberg uses eye contact as a power tool — and when it backfires",
      "moments": [
        {"at_second": 12, "technique": "Unblinking Hold", "what": "Mark doesn't blink for 3–4 seconds while processing her answer", "why": "Forces the other person to look away first — establishing dominance"},
        {"at_second": 28, "technique": "Contempt Break", "what": "Eyes drop briefly before looking back — not submissive, dismissive", "why": "Signals that her words didn't register as important"},
        {"at_second": 45, "technique": "Analytical Stare", "what": "He watches her face while she speaks, categorising rather than connecting", "why": "Shows how eye contact without warmth reads as cold assessment"},
        {"at_second": 68, "technique": "The Non-Blink Challenge", "what": "She holds his gaze back — the scene becomes a staring contest", "why": "Illustrates that strong eye contact invites reciprocal intensity"},
        {"at_second": 90, "technique": "Dead Gaze", "what": "Eyes fully unfocused as he finishes his point", "why": "Eye contact that disengages while speaking signals the conversation is already over for him"},
        {"at_second": 118, "technique": "Exit Gaze", "what": "He doesn't watch her leave — stares at table", "why": "Final signal: the person who looks away last controls the emotional exit"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Hold Without Blinking", "instruction": "Speak one sentence while holding eye contact with the camera the entire time — no blinking.", "tip": "Blink naturally between sentences, not during them.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Gaze on Silence", "instruction": "Ask a question, then hold eye contact through 3 seconds of silence before continuing.", "tip": "The silence + gaze combo is the real skill — let it land.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Dominant vs Warm", "instruction": "Repeat the same line twice — once with cold intensity (Zuckerberg style), once with warm focus. Feel the difference.", "tip": "Same duration of eye contact, different emotional state behind it.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Full Scene", "instruction": "Deliver a 20-second argument while maintaining unbroken eye contact — no glancing away to think.", "tip": "If you lose the gaze to think, pause, find the camera, then continue.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 12, "type": "technique", "note": "Unblinking hold — dominance signal"},
      {"at_second": 45, "type": "technique", "note": "Analytical stare — no warmth"},
      {"at_second": 90, "type": "warning", "note": "Dead gaze — signals disengagement"}
    ]
  },
  {
    "youtube_video_id": "tjMGuJMIgwM",
    "movie_title": "The Social Network", "year": 2010,
    "character_name": "Eduardo Saverin", "actor_name": "Andrew Garfield",
    "scene_description": "Eduardo confronts Mark after discovering his shares were diluted — his eye contact shifts from betrayal to fury as he delivers his ultimatum.",
    "skill_category": "eye-contact", "difficulty": "intermediate",
    "start_sec": 15, "end_sec": 115,
    "signal_clarity": 2, "noise_level": 2, "context_dependency": 2, "replication_difficulty": 2, "difficulty_score": 8,
    "screenplay_source": "https://imsdb.com/scripts/Social-Network,-The.html",
    "annotation": "Eduardo's eye contact journey — from searching for answers, to locked fury — shows how gaze direction reveals emotional state. The moment he stops looking for reassurance and holds Mark's eyes fully, the power shifts.",
    "script": "1. Enter with searching eye contact — you're still hoping you're wrong.\n2. As confirmation lands, let your gaze harden — hold it without looking away.\n3. Deliver your ultimatum directly to their eyes — not to the room.\n4. The final look before you leave should last two full beats.",
    "observation_guide": {
      "headline": "Eduardo's eye contact shift from confusion to command",
      "moments": [
        {"at_second": 18, "technique": "Searching Gaze", "what": "Eduardo looks between Mark and Sean, still seeking explanation", "why": "Searching eye contact signals openness — you haven't decided yet"},
        {"at_second": 35, "technique": "The Realisation Lock", "what": "Eyes fix on Mark the moment understanding hits", "why": "The instant your eyes stop moving and lock on is the moment your message lands"},
        {"at_second": 52, "technique": "Betrayal Gaze", "what": "Wide, slightly wet eyes — full contact without blinking", "why": "Emotional eye contact combined with stillness creates confrontational gravity"},
        {"at_second": 70, "technique": "Command Hold", "what": "Chin drops slightly, gaze rises — eyes lower from above", "why": "The slight chin-down angle with held gaze is a primal dominance signal"},
        {"at_second": 90, "technique": "The Ultimatum Stare", "what": "Doesn't break contact while delivering 'I'm coming back for everything'", "why": "Maintaining eye contact through a high-stakes statement amplifies its credibility"},
        {"at_second": 108, "technique": "Exit Break", "what": "Looks away first to leave — but it reads as choice not defeat", "why": "Context determines whether breaking first reads as weak or decisive"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Searching to Locked", "instruction": "Look around the room (searching) for 3 seconds, then lock eyes with the camera — hold for 5 seconds.", "tip": "The transition is the skill — make it intentional, not accidental.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Hold Through Emotion", "instruction": "Think of something that upset you, then deliver 'I need an explanation' directly to camera without looking away.", "tip": "Emotional authenticity makes held eye contact powerful, not aggressive.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Ultimatum Delivery", "instruction": "Deliver a firm statement ('This has to change') while holding eye contact through the full sentence, including the last word.", "tip": "Most people drop gaze at the end — holding through builds gravity.", "target_duration_sec": 30},
      {"step_number": 4, "skill_focus": "Controlled Exit", "instruction": "Deliver a complete 30-second confrontational monologue, then hold eye contact for a beat before deliberately looking away.", "tip": "The held pause after your last word is your power move.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 18, "type": "technique", "note": "Searching gaze — still processing"},
      {"at_second": 52, "type": "technique", "note": "Betrayal gaze — full emotional contact"},
      {"at_second": 90, "type": "technique", "note": "Ultimatum stare — maximum hold"}
    ]
  },
  {
    "youtube_video_id": "D6me2-OurCw",
    "movie_title": "The Godfather", "year": 1972,
    "character_name": "Vito Corleone", "actor_name": "Marlon Brando",
    "scene_description": "Vito Corleone receives Bonasera's request — his hooded, unhurried gaze radiates total authority without ever raising his voice.",
    "skill_category": "eye-contact", "difficulty": "advanced",
    "start_sec": 30, "end_sec": 150,
    "signal_clarity": 2, "noise_level": 1, "context_dependency": 3, "replication_difficulty": 3, "difficulty_score": 9,
    "screenplay_source": "https://imsdb.com/scripts/Godfather,-The.html",
    "annotation": "Brando's Corleone barely moves his eyes — they are heavy-lidded, slow to travel, and always slightly below the expected line of gaze. This downward, unhurried eye contact is one of cinema's great lessons in effortless authority.",
    "script": "1. Lower your eyelids slightly — not sleepy, thoughtful.\n2. Let your gaze arrive slowly — don't dart eyes immediately to the speaker.\n3. When you have the floor, look at them slightly longer than they expect.\n4. Silence + eye contact is your most powerful response.",
    "observation_guide": {
      "headline": "Vito Corleone: how heavy-lidded, slow gaze signals total authority",
      "moments": [
        {"at_second": 32, "technique": "The Hooded Gaze", "what": "Eyelids at 60% — heavy but alert, like a resting predator", "why": "Fully open eyes signal alertness or anxiety; half-lidded signals control and comfort"},
        {"at_second": 50, "technique": "Delayed Eye Arrival", "what": "Doesn't immediately look at Bonasera — lets the pause build first", "why": "The person who looks last controls the opening beat of a conversation"},
        {"at_second": 68, "technique": "The Stillness Hold", "what": "Face barely moves; only the eyes track the speaker", "why": "Physical stillness amplifies the significance of every eye movement"},
        {"at_second": 90, "technique": "Below-Centre Gaze", "what": "Eyes slightly lower than expected — looking at the speaker's mouth or collar", "why": "Gazing below eye level creates a subtle downward authority dynamic"},
        {"at_second": 112, "technique": "The Listener's Power", "what": "Doesn't look away while the other person speaks nervously", "why": "Maintaining eye contact while listening is more powerful than while talking"},
        {"at_second": 140, "technique": "Slow Break", "what": "When he looks away, it's gradual — eyes slide, not snap", "why": "Slow eye breaks signal control; fast breaks signal discomfort"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Hooded Gaze", "instruction": "Lower your eyelids to 60%, look at camera. Hold for 10 seconds without fully opening them. Don't look sleepy — look settled.", "tip": "Think 'calm certainty' not 'tired'.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Slow Eye Arrival", "instruction": "Look off-camera, then slowly bring your gaze to the camera — take 2 full seconds to arrive. Don't snap.", "tip": "The slow arrival says 'I'm choosing to look at you'.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Power Listening", "instruction": "Listen to someone speak (or imagine it) and hold eye contact the entire time — no social glances away.", "tip": "Listening with full eye contact is rarer and more powerful than speaking with it.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Authority Scene", "instruction": "Receive a request (someone telling you a problem) with Corleone's gaze — hooded, still, listening. Respond in 2 sentences without looking away.", "tip": "Let the other person finish completely before you respond.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 32, "type": "technique", "note": "Hooded gaze — authority through stillness"},
      {"at_second": 50, "type": "technique", "note": "Delayed eye arrival — controls the beat"},
      {"at_second": 112, "type": "technique", "note": "Power listening — maximum contact while silent"}
    ]
  },
  {
    "youtube_video_id": "qwf0MrxCAHk",
    "movie_title": "Catch Me If You Can", "year": 2002,
    "character_name": "Frank Abagnale Jr.", "actor_name": "Leonardo DiCaprio",
    "scene_description": "Frank passes himself off as a Harvard-educated attorney — his calm, direct eye contact in the courtroom makes a room full of lawyers believe him completely.",
    "skill_category": "eye-contact", "difficulty": "intermediate",
    "start_sec": 20, "end_sec": 110,
    "signal_clarity": 1, "noise_level": 1, "context_dependency": 2, "replication_difficulty": 2, "difficulty_score": 7,
    "screenplay_source": "https://imsdb.com/scripts/Catch-Me-If-You-Can.html",
    "annotation": "Frank's power is eye contact that signals certainty. He looks at the judge, at opposing counsel, at the room — each look says 'I belong here.' The lesson: confident eye contact precedes credibility.",
    "script": "1. When you enter the room, make eye contact with the most important person first.\n2. Don't look for reassurance — look with ownership.\n3. When questioned, hold gaze before answering — don't break to think.\n4. Move your eye contact deliberately: judge, then jury, then back.",
    "observation_guide": {
      "headline": "Frank Abagnale's eye contact con: how calm gaze creates instant credibility",
      "moments": [
        {"at_second": 22, "technique": "Entry Gaze", "what": "Frank scans the room slowly, making brief contact with each authority figure", "why": "Scanning with calm confidence signals you know the space — insiders always do"},
        {"at_second": 38, "technique": "Judge Contact", "what": "Holds eye contact with the judge for the full duration of a professional greeting", "why": "Eye contact with the highest authority in the room establishes your status"},
        {"at_second": 55, "technique": "Steady Answer Gaze", "what": "When questioned, holds gaze before answering — no flicker of doubt", "why": "Breaking eye contact to access memory reads as fabrication; holding while thinking reads as confidence"},
        {"at_second": 72, "technique": "Inclusive Scan", "what": "Looks at the full room while speaking — not just at the questioner", "why": "Expanding your gaze to include the room signals you're talking to everyone, not defending to one"},
        {"at_second": 88, "technique": "The Ownership Look", "what": "Brief look around as if assessing his territory, then back to judge", "why": "People who belong somewhere check it — they don't nervously stare at one spot"},
        {"at_second": 105, "technique": "Calm Ending Gaze", "what": "Holds contact as the exchange concludes — no rush to look away", "why": "Holding gaze after you've finished speaking says: I'm comfortable with what I just said"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Entry Scan", "instruction": "Walk into a scene (your room), pause, and slowly scan the space with calm eye contact at each 'person'. Don't rush.", "tip": "Think of each look as a brief acknowledgement, not a search.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Hold Before Answer", "instruction": "Someone asks you a question. Hold eye contact for 1 full second before you begin your answer.", "tip": "That pause says 'I know the answer — I'm choosing when to give it'.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Room Inclusion", "instruction": "Give a 20-second answer while moving your gaze to 3 different 'people' in the room — don't fix on one spot.", "tip": "Each time you shift gaze, briefly land (1–2 sec) before moving on.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Full Credibility Scene", "instruction": "Introduce yourself as an expert in something you know, using only eye contact to establish authority. No notes, no looking away.", "tip": "Your certainty lives in your eyes — not your words.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 22, "type": "technique", "note": "Entry scan — ownership gaze"},
      {"at_second": 55, "type": "technique", "note": "No flicker — gaze under questioning"},
      {"at_second": 72, "type": "technique", "note": "Room inclusion — expands authority"}
    ]
  },
  {
    "youtube_video_id": "psSQsNqgUzg",
    "movie_title": "Before Sunrise", "year": 1995,
    "character_name": "Jesse", "actor_name": "Ethan Hawke",
    "scene_description": "Jesse asks Celine to get off the train with him — his eye contact is warm, curious, and open-handed rather than intense or pressuring.",
    "skill_category": "eye-contact", "difficulty": "beginner",
    "start_sec": 5, "end_sec": 95,
    "signal_clarity": 1, "noise_level": 1, "context_dependency": 1, "replication_difficulty": 1, "difficulty_score": 4,
    "screenplay_source": "https://imsdb.com/scripts/Before-Sunrise.html",
    "annotation": "Jesse's eye contact is the antithesis of dominance — it's genuinely curious. He looks at Celine the way you look at something beautiful you've just discovered. That warmth makes her believe his sincerity instantly.",
    "script": "1. Let your eyes be soft — slightly wider, relaxed brow.\n2. Look at the person with genuine curiosity, not assessment.\n3. When they speak, your eyes should show you're listening — slight eyebrow raise, subtle nods.\n4. Smile with your eyes before your mouth.",
    "observation_guide": {
      "headline": "Jesse's curious, open gaze — how warm eye contact builds instant trust",
      "moments": [
        {"at_second": 8, "technique": "Soft Entry", "what": "Makes eye contact with a slight, genuine smile — no intensity", "why": "Soft eyes signal openness, not evaluation — it's an invitation, not a test"},
        {"at_second": 22, "technique": "Curious Tilt", "what": "Slight head tilt + eye contact while listening to her response", "why": "The tilt is a universal signal of interest — it makes the other person feel seen"},
        {"at_second": 40, "technique": "Eye Smile", "what": "Eyes crinkle before the mouth smiles — Duchenne smile", "why": "Eye smiling (not just lip smiling) is impossible to fake convincingly — it signals genuine warmth"},
        {"at_second": 58, "technique": "Active Listening Gaze", "what": "Watches her speak with slightly parted lips and widened eyes — all processing, no performing", "why": "Gaze that shows you're computing what you're hearing builds connection faster than any words"},
        {"at_second": 72, "technique": "The Ask with Eyes", "what": "His pitch ('come with me') comes with wide, hopeful eyes — no pressure", "why": "Keeping gaze warm and open during a request removes the coercive element"},
        {"at_second": 88, "technique": "Patient Wait", "what": "Holds soft eye contact while she considers — no pushing", "why": "Maintaining warm gaze during silence says 'I'm comfortable either way'"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Soft Eye Set", "instruction": "Look at camera with genuinely relaxed, curious eyes — slightly wider, unfurrowed brow. Hold for 15 seconds.", "tip": "Think of something that makes you curious — let that feeling set your expression.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Eye Smile", "instruction": "Let a smile form in your eyes first — before it reaches your mouth. Hold for 10 seconds.", "tip": "Squint very slightly at the outer corners — that's the Duchenne marker.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Active Listening Gaze", "instruction": "Listen to someone speak (or imagine it), showing with your eyes that you're genuinely processing — light nods, slight eyebrow rises.", "tip": "Your eyes should move the story forward — they're part of the response.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Warm Ask", "instruction": "Make a genuine request to camera ('I'd love your opinion on something') with completely warm, open eye contact — no intensity.", "tip": "Soft eye contact during a request removes pressure and increases yes-rate.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 8, "type": "technique", "note": "Soft entry — warm, not intense"},
      {"at_second": 40, "type": "technique", "note": "Eye smile — genuine Duchenne marker"},
      {"at_second": 72, "type": "technique", "note": "Warm ask — open-handed gaze"}
    ]
  },
  # ── open-posture ─────────────────────────────────────────────────────────────
  {
    "youtube_video_id": "lKn-Agk-yAI",
    "movie_title": "Gladiator", "year": 2000,
    "character_name": "Maximus", "actor_name": "Russell Crowe",
    "scene_description": "Maximus reveals his identity to Commodus in the arena — standing fully square, chin up, arms spread wide as he delivers his name.",
    "skill_category": "open-posture", "difficulty": "intermediate",
    "start_sec": 10, "end_sec": 100,
    "signal_clarity": 1, "noise_level": 2, "context_dependency": 2, "replication_difficulty": 2, "difficulty_score": 7,
    "screenplay_source": "https://imsdb.com/scripts/Gladiator.html",
    "annotation": "This is cinematic open posture at maximum amplitude. Arms extended, chest fully open, feet planted wide — every centimetre of Maximus's body says 'I am not afraid.' Watch how the posture precedes the words and makes them inevitable.",
    "script": "1. Plant feet shoulder-width apart — rooted, not rigid.\n2. Square your shoulders fully to face whoever you're addressing.\n3. If you use your arms, extend them fully — no half-gestures.\n4. Chin level, chest forward — let your body announce you before your words do.",
    "observation_guide": {
      "headline": "Maximus's power reveal — open posture at its most cinematic",
      "moments": [
        {"at_second": 12, "technique": "Wide Stance", "what": "Feet planted well beyond shoulder width — maximum ground coverage", "why": "A wider stance lowers your centre of gravity and signals immovability"},
        {"at_second": 25, "technique": "Full Square", "what": "Torso turned entirely to face the emperor — no angling away", "why": "Squaring up fully to authority signals you have nothing to hide and nothing to fear"},
        {"at_second": 40, "technique": "Chest Expansion", "what": "Deep breath visibly expands the chest before speaking", "why": "Expanding the chest before speech is a primal power signal that also supports vocal projection"},
        {"at_second": 55, "technique": "Arm Extension", "what": "Arms spread wide and open during the name declaration", "why": "Open arms make you physically larger — the universal space-taking signal of confidence"},
        {"at_second": 72, "technique": "Chin Elevation", "what": "Chin slightly elevated — not arrogant, declarative", "why": "Chin up exposes the throat — the most vulnerable part of the body — a counter-intuitive signal of fearlessness"},
        {"at_second": 88, "technique": "Hold After", "what": "Posture doesn't collapse after the declaration — holds fully open", "why": "Maintaining open posture after a high-stakes statement says: I stand behind what I said"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Wide Stance", "instruction": "Stand with feet wider than shoulder-width. Feel the ground. Hold for 30 seconds — notice how your upper body responds.", "tip": "Don't lock your knees — soft bend keeps it powerful, not wooden.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Full Square + Chest Open", "instruction": "Face camera fully — no side angle. Take a deep breath that visibly expands your chest. Hold the expansion as you exhale.", "tip": "The breath is the signal — do it consciously before important statements.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Arm Extension", "instruction": "Extend both arms wide (like a wingspan) while saying your name or a key statement. Hold the extension for 2 seconds after speaking.", "tip": "Extend fully — half-extended arms lose the effect.", "target_duration_sec": 30},
      {"step_number": 4, "skill_focus": "Full Reveal Posture", "instruction": "Enter frame, plant your stance, breathe, and deliver a self-introduction using full open posture throughout. Don't collapse after.", "tip": "Your last position in the scene is as important as your first.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 12, "type": "technique", "note": "Wide stance — ground coverage"},
      {"at_second": 40, "type": "technique", "note": "Chest expansion before speech"},
      {"at_second": 55, "type": "technique", "note": "Arm extension — maximum openness"}
    ]
  },
  {
    "youtube_video_id": "CDpTc32sV1Y",
    "movie_title": "Gladiator", "year": 2000,
    "character_name": "Maximus", "actor_name": "Russell Crowe",
    "scene_description": "Maximus addresses his cavalry before the battle of Carthage — moving through his troops with an open, unhurried physicality that radiates command.",
    "skill_category": "open-posture", "difficulty": "beginner",
    "start_sec": 5, "end_sec": 90,
    "signal_clarity": 1, "noise_level": 2, "context_dependency": 2, "replication_difficulty": 1, "difficulty_score": 5,
    "screenplay_source": "https://imsdb.com/scripts/Gladiator.html",
    "annotation": "Pre-battle Maximus shows open posture in motion — how you walk through a space matters as much as how you stand. Arms away from body, shoulders back, moving with deliberate calm. Perfect beginner lesson in physicality.",
    "script": "1. Walk with your arms slightly away from your body — not swinging, just clear.\n2. Shoulders back naturally — imagine a thread lifting the back of your skull.\n3. Move at a slightly slower pace than feels natural — deliberate is powerful.\n4. Make eye contact with the people you address, then move on — don't linger.",
    "observation_guide": {
      "headline": "Maximus in motion — how open posture walks through a room",
      "moments": [
        {"at_second": 8, "technique": "Arms Cleared", "what": "Arms hang slightly away from the body — not rigid, just open", "why": "Arms pressed to sides shrink you; arms slightly cleared expand your presence"},
        {"at_second": 22, "technique": "Deliberate Pace", "what": "Moving at 80% of normal walking speed through the troops", "why": "Slowing your movement in a space signals ownership — rushing signals urgency or insecurity"},
        {"at_second": 38, "technique": "Open Chest Forward", "what": "Chest leads the movement — not the chin, not the hips", "why": "Leading with the chest is the walking version of open posture — it reads as confidence"},
        {"at_second": 52, "technique": "Brief Touch + Move", "what": "A hand on a soldier's shoulder — brief, then open again", "why": "Open posture in social contexts includes appropriate touch then release, not clinging"},
        {"at_second": 68, "technique": "Still Point", "what": "Stops moving, plants, holds position while speaking", "why": "Leaders punctuate movement with stillness — the stop is as important as the walk"},
        {"at_second": 82, "technique": "Back Straight During Turn", "what": "Full spine engagement even when turning to walk away", "why": "People read your posture when you're not looking at them — the exit posture is the lasting impression"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Arms Cleared Walk", "instruction": "Walk across a room with your arms slightly away from your body — no touching your sides. Feel the openness.", "tip": "Imagine you have small oranges under your armpits — that natural clearance is all you need.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Deliberate Pace", "instruction": "Walk slowly and deliberately to camera, chest leading. Stop 1 metre away. Hold the stillness.", "tip": "If it feels too slow, it's probably right.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Chest Lead", "instruction": "Walk forward consciously leading with your sternum — not your chin, not your belly. Notice how your whole posture adjusts.", "tip": "Think of the chest as the bow of a ship — everything else follows.", "target_duration_sec": 30},
      {"step_number": 4, "skill_focus": "Address While Moving", "instruction": "Walk, stop, deliver a 20-second message with open posture, then walk away — maintaining posture until you're fully out of frame.", "tip": "Your exit posture is what people remember.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 8, "type": "technique", "note": "Arms cleared — opens the silhouette"},
      {"at_second": 38, "type": "technique", "note": "Chest leads movement — command walk"},
      {"at_second": 68, "type": "technique", "note": "Still point — punctuates with presence"}
    ]
  },
  {
    "youtube_video_id": "f1C6b2Wd8HM",
    "movie_title": "Any Given Sunday", "year": 1999,
    "character_name": "Tony D'Amato", "actor_name": "Al Pacino",
    "scene_description": "Coach D'Amato delivers the 'inches' speech in the locker room — his posture starts hunched and broken, then physically rebuilds as conviction returns.",
    "skill_category": "open-posture", "difficulty": "advanced",
    "start_sec": 15, "end_sec": 140,
    "signal_clarity": 2, "noise_level": 2, "context_dependency": 2, "replication_difficulty": 3, "difficulty_score": 10,
    "screenplay_source": "https://imsdb.com/scripts/Any-Given-Sunday.html",
    "annotation": "This speech is a masterclass in intentional posture progression. D'Amato begins collapsed — shoulders forward, head down — and literally straightens as his conviction builds. By the end, he's fully open. The posture tells the story before the words do.",
    "script": "Begin collapsed (slouched, head low), then as conviction builds:\n1. Roll shoulders back one at a time.\n2. Raise your head — let your chin come to level.\n3. Step forward as you commit to your point.\n4. Reach your full height and open your chest at the climax of your message.",
    "observation_guide": {
      "headline": "D'Amato's posture arc — from collapse to command over one speech",
      "moments": [
        {"at_second": 18, "technique": "Intentional Collapse", "what": "Shoulders rolled forward, head low — the posture of a broken man", "why": "Beginning vulnerable (not performed) earns trust before conviction earns respect"},
        {"at_second": 35, "technique": "First Lift", "what": "Head raises slightly as the first insight lands", "why": "Physical posture changes track emotional state — the head lifting is the turning point"},
        {"at_second": 55, "technique": "Shoulder Roll Back", "what": "One shoulder slowly rolls back, then the other", "why": "The gradual expansion is more powerful than snapping to attention — it's genuine, not performed"},
        {"at_second": 78, "technique": "Step Forward", "what": "Takes a deliberate step toward the team as conviction builds", "why": "Forward movement into your audience signals you believe in what you're saying"},
        {"at_second": 105, "technique": "Full Extension", "what": "Arms out, chest fully open — maximum physical presence", "why": "The fully open posture at the speech's peak is the physical equivalent of his emotional conviction"},
        {"at_second": 132, "technique": "Hold + Breathe", "what": "Fully expanded posture held through the final beat", "why": "Don't collapse your posture the moment you finish — hold it through the audience's response"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Start Collapsed", "instruction": "Intentionally hunch — shoulders forward, head low — and hold that for 15 seconds. Notice how it affects how you'd feel speaking.", "tip": "This is the before state — feel it fully before you change it.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Gradual Rebuild", "instruction": "From the collapsed position, slowly rebuild your posture over 20 seconds — head first, then shoulders, then chest.", "tip": "The rebuild should feel like realisation, not instruction.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Step and Commit", "instruction": "Deliver a 20-second passionate statement. As you hit your main point, take one deliberate step forward and open your chest.", "tip": "The step is your physical commitment — it says 'I mean this'.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Full Arc", "instruction": "Deliver the full 'we fight for that inch' speech structure: begin broken, rebuild to full open posture, hold at the climax.", "tip": "The story of your posture IS the story.", "target_duration_sec": 90}
    ],
    "annotations": [
      {"at_second": 18, "type": "technique", "note": "Intentional collapse — earns trust"},
      {"at_second": 55, "type": "technique", "note": "Shoulder roll — rebuilding signal"},
      {"at_second": 105, "type": "technique", "note": "Full open posture at conviction peak"}
    ]
  },
  {
    "youtube_video_id": "ZwMVMbmQBug",
    "movie_title": "Network", "year": 1976,
    "character_name": "Howard Beale", "actor_name": "Peter Finch",
    "scene_description": "Howard Beale's iconic 'I'm mad as hell' broadcast — physically erupting from anchor stillness into full-body declaration.",
    "skill_category": "open-posture", "difficulty": "advanced",
    "start_sec": 20, "end_sec": 130,
    "signal_clarity": 2, "noise_level": 2, "context_dependency": 3, "replication_difficulty": 3, "difficulty_score": 11,
    "screenplay_source": "https://imsdb.com/scripts/Network.html",
    "annotation": "Finch shows the transformational power of going from physically constrained to fully open. The broadcast begins composed and ends with arms wide, face to the sky — complete body liberation. The posture of righteous conviction.",
    "script": "1. Begin contained — seated or standing straight but controlled.\n2. As emotion builds, let your body follow it — arms rising, chest opening.\n3. At maximum conviction, arms wide, face forward — no hedging.\n4. Your body should match the scale of what you're saying.",
    "observation_guide": {
      "headline": "Howard Beale: posture as revolution — from anchor desk to full extension",
      "moments": [
        {"at_second": 22, "technique": "Controlled Opening", "what": "Seated but leaning forward — contained energy seeking release", "why": "Leaning forward with an erect spine signals gathering intensity before release"},
        {"at_second": 40, "technique": "Stand Up Transition", "what": "Stands without being told — breaks the implicit 'stay seated' rule", "why": "Breaking a physical convention (standing at the anchor desk) is itself a posture statement"},
        {"at_second": 60, "technique": "Chest Thrust", "what": "Chest visibly forward, shoulders back and down — combat posture", "why": "The chest thrust is a primal declaration of challenge — powerful when earned"},
        {"at_second": 85, "technique": "Arms Rise", "what": "Arms gradually spreading outward as volume and conviction build", "why": "Arms rising involuntarily signals authentic emotional truth — it's not performed"},
        {"at_second": 108, "technique": "Maximum Extension", "what": "Full wingspan — arms out, face up, body fully extended", "why": "This is the peak of the posture arc — full open = full conviction"},
        {"at_second": 122, "technique": "Sustained Hold", "what": "Holds the open position through the final repeated declaration", "why": "Sustaining open posture through repetition shows physical commitment to the message"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Leaning Intensity", "instruction": "Sit or stand contained, then lean forward with an erect spine — gather intensity without releasing it yet. Hold 15 seconds.", "tip": "Think of a coiled spring — energy building, not yet expressed.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "The Stand Up Moment", "instruction": "Mid-sentence, stand up. Let the standing be the physical punctuation of a decision.", "tip": "Standing mid-conversation or mid-scene is one of the most powerful posture interrupts.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Arms Follow Conviction", "instruction": "Deliver a passionate statement and let your arms rise naturally as your conviction builds — don't force, allow.", "tip": "If your arms don't want to rise, the words aren't convincing you yet.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "Climax Posture", "instruction": "Deliver 'I'm mad as hell and I'm not going to take this anymore' with full body expansion at 'anymore'.", "tip": "Maximum open posture requires maximum authentic conviction — find something you genuinely care about.", "target_duration_sec": 60}
    ],
    "annotations": [
      {"at_second": 40, "type": "technique", "note": "Stand up — breaks physical convention"},
      {"at_second": 85, "type": "technique", "note": "Arms rising — authentic not performed"},
      {"at_second": 108, "type": "technique", "note": "Maximum extension — peak conviction"}
    ]
  },
  {
    "youtube_video_id": "2_fDhqRk_Ro",
    "movie_title": "Coach Carter", "year": 2005,
    "character_name": "Timo Cruz", "actor_name": "Robert Ri'chard",
    "scene_description": "Timo stands and recites the 'Our Deepest Fear' speech — a player who barely speaks finding full physical presence in front of his team.",
    "skill_category": "open-posture", "difficulty": "intermediate",
    "start_sec": 10, "end_sec": 100,
    "signal_clarity": 1, "noise_level": 1, "context_dependency": 1, "replication_difficulty": 2, "difficulty_score": 6,
    "screenplay_source": "https://imsdb.com/scripts/Coach-Carter.html",
    "annotation": "Timo's physical journey through this speech is a blueprint for finding presence. Watch how he starts uncertain, then opens by degrees — each line standing taller, chest opening wider, voice supporting the body.",
    "script": "1. Stand fully — don't lean on anything, don't cross your arms.\n2. Keep your feet planted through every word — don't shift weight nervously.\n3. Let your voice and your posture build together.\n4. 'Shine' — let it happen physically, not just vocally.",
    "observation_guide": {
      "headline": "Timo Cruz finds his presence — an open posture journey in real time",
      "moments": [
        {"at_second": 12, "technique": "Starting Posture", "what": "Upright but slightly contracted — arms close to body, shoulders marginally forward", "why": "Even good posture under pressure shows micro-contractions — notice them in yourself"},
        {"at_second": 28, "technique": "Breath and Open", "what": "Takes a visible breath that opens the chest before the key line", "why": "The breath before a powerful statement is also a posture reset — it opens you physically"},
        {"at_second": 45, "technique": "Feet Plant", "what": "Both feet firmly down, weight distributed — stops rocking", "why": "Weight shifting reveals anxiety; planted feet signal ownership of the space"},
        {"at_second": 62, "technique": "Progressive Opening", "what": "Arms gradually move away from body as the speech builds", "why": "Authentic physical opening — not performed — tracks emotional conviction in real time"},
        {"at_second": 78, "technique": "Full Chest Forward", "what": "At 'let our own light shine' — chest fully forward, chin up", "why": "The posture matches the message exactly — the body says what the words mean"},
        {"at_second": 92, "technique": "End Hold", "what": "Holds full open posture as applause begins — doesn't deflate", "why": "Collapsing your posture when you finish is a subconscious apology — hold until the response completes"}
      ]
    },
    "practice_steps": [
      {"step_number": 1, "skill_focus": "Planted Stance", "instruction": "Stand completely still — both feet planted, weight even. Don't shift for 30 seconds. Notice what you want to do with your body.", "tip": "The urge to shift is anxiety — recognising it is the first step to stopping it.", "target_duration_sec": 30},
      {"step_number": 2, "skill_focus": "Pre-Breath Reset", "instruction": "Before speaking, take one visible breath that opens your chest. Let that breath set your posture before a single word comes out.", "tip": "This breath is a posture move, not just a breathing technique.", "target_duration_sec": 30},
      {"step_number": 3, "skill_focus": "Progressive Open", "instruction": "Start with arms at sides. As you speak, let your arms naturally move outward as your passion builds — don't force them, allow them.", "tip": "If your arms don't want to open, slow down and find more conviction in what you're saying.", "target_duration_sec": 45},
      {"step_number": 4, "skill_focus": "The Full Poem", "instruction": "Deliver the 'Our Deepest Fear' poem (or any meaningful text) standing fully open, without deflating — even during the pause between lines.", "tip": "Posture between sentences is when most people collapse. Hold through the pauses.", "target_duration_sec": 90}
    ],
    "annotations": [
      {"at_second": 28, "type": "technique", "note": "Breath opens the chest — posture reset"},
      {"at_second": 62, "type": "technique", "note": "Progressive opening — authentic not forced"},
      {"at_second": 92, "type": "technique", "note": "Hold after — don't deflate on applause"}
    ]
  },
]

# Filter out any IDs already in file
new_clips = [c for c in NEW_CLIPS if c["youtube_video_id"] not in existing_ids]

# Number them
for i, clip in enumerate(new_clips):
    num = start_num + i
    clip["id"] = f"clip_{num:03d}"

# Validate each clip has required fields
required = ["youtube_video_id","movie_title","scene_description","skill_category",
            "difficulty","start_sec","end_sec","signal_clarity","noise_level",
            "context_dependency","replication_difficulty","difficulty_score",
            "annotation","observation_guide","practice_steps","screenplay_source","script"]
for c in new_clips:
    missing = [k for k in required if not c.get(k)]
    if missing:
        print(f"WARNING: {c['id']} missing: {missing}")

# Add annotations array if missing
for c in new_clips:
    if "annotations" not in c:
        c["annotations"] = []

data["clips"].extend(new_clips)
data["_meta"] = {"status": "verified", "version": "2.0", "total": len(data["clips"])}

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Batch 1 complete — added {len(new_clips)} clips. Total: {len(data['clips'])}")
