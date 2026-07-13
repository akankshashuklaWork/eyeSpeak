// Person 3 owns this file: patient memory.
//
// This is a lightweight in-memory stand-in for Cognee's semantic memory.
// Swap the bodies of these functions for real Cognee SDK/API calls —
// the call signatures below (recordInteraction / getPreferredPhrases / getHistory)
// are what the rest of the app depends on, so keep them stable.

const DEFAULT_PATIENT = 'demo-patient';
const MAX_RECENT_PHRASES = 5;
const MAX_HISTORY = 50;

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
