// Person 4 owns this file: Nimble-powered caregiver search.
//
// TODO: replace the fetch call below with the real Nimble endpoint/auth shape
// from their docs. Until NIMBLE_API_KEY is set (or if the call fails), this
// returns mock results so the caregiver tab always has something to show.

const NIMBLE_API_KEY = process.env.NIMBLE_API_KEY;
const NIMBLE_URL = process.env.NIMBLE_URL || 'https://api.nimbleway.com/v1/search';

const MOCK_RESULTS = [
  { title: 'Sunrise Rehabilitation Center', snippet: 'Stroke recovery & physical therapy — 2.3 miles away.' },
  { title: 'Bay Area Neuro Rehab', snippet: 'Specializes in post-stroke motor recovery and speech therapy.' },
  { title: '5 Stroke Recovery Exercises for Hand Mobility', snippet: 'Physio-approved exercises to help regain grip strength.' },
];

export async function caregiverSearch({ query }) {
  if (!NIMBLE_API_KEY) {
    return { results: MOCK_RESULTS, source: 'mock' };
  }

  try {
    const res = await fetch(NIMBLE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NIMBLE_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) throw new Error(`Nimble responded with ${res.status}`);

    const data = await res.json();
    const results = (data.results || []).map((r) => ({ title: r.title, snippet: r.snippet }));
    return { results: results.length ? results : MOCK_RESULTS, source: results.length ? 'nimble' : 'mock' };
  } catch (err) {
    console.error('[nimble] search failed, using mock results:', err.message);
    return { results: MOCK_RESULTS, source: 'mock' };
  }
}
