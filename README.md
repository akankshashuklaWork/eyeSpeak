# eyeSpeak

A stroke/paralysis patient communicates using only eye gaze. The AI understands intent,
remembers preferences, and speaks it out loud.

5-hour hackathon MVP — no login, no dashboards, no analytics. Just the live demo path.

## Architecture

```
                Camera
                    │
                    ▼
         Eye Tracking (Person 1, frontend/)
                    │
                    ▼
          Selected Category
                    │
                    ▼
          POST /api/category (Person 4, backend/)
                    │
                    ▼
          BAND pipeline (Person 3, backend/src/services/band.js)
          Vision Agent -> Memory Agent -> Communication Agent
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
 Cognee Memory           Nebius LLM
 (services/memory.js)   (services/ai.js)
        └───────────┬───────────┘
                    ▼
          Generated Sentence
                    │
                    ▼
      Text-to-Speech (browser Web Speech API, frontend)
                    │
                    ▼
        Caregiver tab → Nimble search (services/nimble.js)
```

| Sponsor  | Responsibility                                              | File(s) |
|----------|---------------------------------------------------------------|---------|
| Nebius   | Runs the AI model that generates the patient's sentence       | `backend/src/services/ai.js` |
| Cognee   | Learns and remembers the patient's communication patterns     | `backend/src/services/memory.js` |
| BAND     | Coordinates Vision → Memory → Communication agents             | `backend/src/services/band.js` |
| InsForge | Hosts/deploys the app                                          | deploy `backend/` + `frontend/` there |
| Nimble   | Live info for the caregiver tab (rehab centers, exercises)     | `backend/src/services/nimble.js` |

Every external integration has a graceful fallback (canned sentences, mock search
results) so the demo still works if a key isn't wired up yet or wifi drops mid-demo.

## Project layout

```
eyeSpeak/
  backend/            Person 4 (+ 2, 3 own the services/ files)
    src/
      index.js         Express app entry
      routes.js         POST /api/category, /api/save, GET /api/history, POST /api/caregiver
      services/
        ai.js           Person 2 — Nebius sentence generation
        memory.js       Person 3 — Cognee stand-in (in-memory patient memory)
        band.js         Person 3 — agent orchestration pipeline
        nimble.js       Person 4 — caregiver search
  frontend/           Person 1
    app/
      page.jsx          Patient UI: glassmorphic cards + gaze cursor + dwell selection + TTS
      caregiver/page.jsx Caregiver search tab
      layout.jsx        Aurora background + Outfit font
      globals.css
    components/
      GazeCalibration.jsx  5-point calibration screen (look + click)
    hooks/
      useGazeTracker.js MediaPipe iris-based gaze estimation, smoothing, affine calibration fit
    lib/api.js          Fetch wrappers to the backend
```

## Running it

You need two terminal windows — the backend and frontend are separate apps that talk
over HTTP.

**1. Backend**
```
cd backend
npm install
cp .env.example .env   # fill in NEBIUS_API_KEY / NIMBLE_API_KEY when ready (optional — fallbacks work without them)
npm run dev             # http://localhost:4000
```

**2. Frontend** (in a second terminal)
```
cd frontend
npm install
cp .env.local.example .env.local
npm run dev             # http://localhost:3000
```

**3. Open `http://localhost:3000`** and allow camera access when prompted.

- If the camera/model load successfully, you'll see a 5-point **calibration screen**
  first: look at each glowing dot and click it (center, then the four corners). This
  fits a per-user mapping from iris position to screen coordinates — it only takes a
  few seconds.
- After calibration, look at a card for ~2 seconds to select it (the dwell ring around
  the card fills in as you hold your gaze).
- A **Recalibrate** link appears near the status text once calibrated — useful if a
  new person sits down, or tracking feels off.
- If eye tracking fails to load at all (no camera, no wifi for the MediaPipe model
  download), the cards are still directly clickable — the demo doesn't die.

Requires internet access on first load: MediaPipe's WASM runtime and face model are
fetched from a CDN (`cdn.jsdelivr.net`, `storage.googleapis.com`) at runtime, and the
Outfit font is fetched via `next/font/google` at build/dev time.

## What's real vs. stubbed right now

- **Eye tracking**: real. Uses MediaPipe FaceLandmarker iris landmarks (468/473) to
  estimate a raw gaze ratio, smoothed frame-to-frame, then mapped to screen
  coordinates via a per-user affine transform fitted from a 5-point calibration
  (`components/GazeCalibration.jsx` + `calibrate()` in the hook). Not clinically
  accurate, but real calibrated tracking rather than a fixed guess — large card
  targets make it workable for a demo.
- **Nebius LLM**: real call path (OpenAI-compatible `/chat/completions`). Falls back
  to canned phrases per category if `NEBIUS_API_KEY` is unset or the call fails.
- **Cognee memory**: currently a plain in-memory store with the same function
  signatures Cognee would need (`recordInteraction`, `getPreferredPhrases`,
  `getHistory`). Swap the internals in `services/memory.js` for real Cognee calls.
- **BAND orchestration**: currently a plain async pipeline function in `band.js`
  with the same 3-stage shape (Vision → Memory → Communication). Swap internals for
  real BAND agents without touching `routes.js`.
- **Nimble caregiver search**: real call path with a placeholder endpoint — replace
  `NIMBLE_URL` handling in `services/nimble.js` with the actual Nimble API shape.
  Falls back to mock rehab center results otherwise.
- **Text-to-speech**: browser `speechSynthesis` (Web Speech API) — zero setup, zero
  network dependency, most demo-safe option.
- **InsForge**: not deployed yet — `backend/` and `frontend/` are plain Node/Next
  apps ready to point at InsForge.

## Demo script (3 min)

1. **Problem (30s)** — millions of stroke and paralysis patients struggle to communicate.
2. **Live demo (90s)** — quick calibration (look + click 5 dots, ~5s), then patient
   looks at 💧 Water → dwell ring fills → AI says "Can I have some water, please?"
   Then looks at 😊 Feeling → AI says something different, informed by memory of past
   interactions.
3. **Caregiver (30s)** — switch to `/caregiver`, search "nearby rehabilitation
   centers", show Nimble-backed results.
4. **Architecture (30s)** — one slide: Nebius → AI, Cognee → Memory, BAND → Agent
   orchestration, InsForge → Infrastructure, Nimble → Caregiver assistant.

## Integration lead

Per the plan: **Person 4** should continuously pull the other three people's work
together throughout the day, not just own the backend. The API contract between
frontend and backend is already fixed above (`POST /api/category`, `POST /api/save`,
`GET /api/history`, `POST /api/caregiver`) — everyone can build against that contract
independently from hour 1.
