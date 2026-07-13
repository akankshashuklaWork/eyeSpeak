// Person 3 owns this file: patient memory.
//
// The in-memory Map below stays the primary read path (instant, always
// available for the live demo). Every interaction is also mirrored into the
// real Cognee Cloud tenant in the background via COGNEE_API_KEY/COGNEE_BASE_URL —
// best-effort, never blocks or throws into the caller. Call signatures
// (recordInteraction / getPreferredPhrases / getHistory) are unchanged so the
// rest of the app doesn't need to know Cognee is involved.

const DEFAULT_PATIENT = 'demo-patient';
const MAX_RECENT_PHRASES = 5;
const MAX_HISTORY = 50;

const COGNEE_API_KEY = process.env.COGNEE_API_KEY;
const COGNEE_BASE_URL = process.env.COGNEE_BASE_URL;
const COGNEE_ENABLED = Boolean(COGNEE_API_KEY && COGNEE_BASE_URL);

const store = new Map();

export function recordInteraction({ patientId = DEFAULT_PATIENT, category, sentence }) {
  const patient = getOrCreatePatient(patientId);

  patient.categoryCounts[category] = (patient.categoryCounts[category] || 0) + 1;

  patient.recentPhrases[category] = patient.recentPhrases[category] || [];
  patient.recentPhrases[category] = [sentence, ...patient.recentPhrases[category].filter((p) => p !== sentence)].slice(
    0,
    MAX_RECENT_PHRASES
  );

  patient.history = [{ category, sentence, at: new Date().toISOString() }, ...patient.history].slice(0, MAX_HISTORY);

  mirrorToCognee({ patientId, category, sentence });
}

export function getPreferredPhrases({ patientId = DEFAULT_PATIENT, category }) {
  const patient = getOrCreatePatient(patientId);
  return patient.recentPhrases[category] || [];
}

export function getHistory({ patientId = DEFAULT_PATIENT }) {
  const patient = getOrCreatePatient(patientId);
  const topCategories = Object.entries(patient.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));

  return { history: patient.history, topCategories };
}

function getOrCreatePatient(patientId) {
  if (!store.has(patientId)) {
    store.set(patientId, { categoryCounts: {}, recentPhrases: {}, history: [] });
  }
  return store.get(patientId);
}

// Fire-and-forget: stores the interaction as a QA-style memory entry in
// Cognee's knowledge graph so it survives across demo runs/deploys. Failures
// are logged, never thrown — the local Map above is what the app actually
// depends on for correctness during the live demo.
function mirrorToCognee({ patientId, category, sentence }) {
  if (!COGNEE_ENABLED) return;

  fetch(`${COGNEE_BASE_URL}/api/v1/remember/entry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': COGNEE_API_KEY,
    },
    body: JSON.stringify({
      entry: {
        type: 'qa',
        question: `What does this patient usually say about ${category}?`,
        answer: sentence,
        context: `category=${category}`,
      },
      dataset_name: 'eyespeak_patients',
      session_id: patientId,
    }),
  }).catch((err) => {
    console.error('[memory] Cognee mirror failed (non-fatal):', err.message);
  });
}
