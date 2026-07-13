// Person 2 owns this file: Nebius-hosted LLM sentence generation.
//
// Category -> AI sentence. If NEBIUS_API_KEY is unset or the call fails,
// falls back to canned phrases so the rest of the demo keeps working.

const NEBIUS_API_KEY = process.env.NEBIUS_API_KEY;
const NEBIUS_BASE_URL = process.env.NEBIUS_BASE_URL || 'https://api.studio.nebius.ai/v1';
const NEBIUS_MODEL = process.env.NEBIUS_MODEL || 'meta-llama/Meta-Llama-3.1-70B-Instruct';

const SYSTEM_PROMPT = `You are the voice of a stroke/paralysis patient who communicates only through eye-gaze selections on a small set of category cards (water, food, feeling, medicine, emergency). Given the selected category and phrases this patient has used before, produce ONE short, natural, first-person sentence they would want to say out loud. Keep it under 12 words. Do not add quotation marks or explanation.`;

const FALLBACK_SENTENCES = {
  water: ["I'm thirsty.", 'Can I have some water, please?', 'I need help drinking.'],
  food: ["I'm hungry.", 'Could I have something to eat?', "I'd like some food, please."],
  feeling: ["I'm feeling okay.", "I'm in some discomfort.", "I'm feeling better today."],
  medicine: ['I need my medicine.', "It's time for my medication.", 'Can you bring my pills?'],
  emergency: ['I need help now!', 'Please call someone, this is urgent.', 'Emergency — please help me.'],
};

export async function generateSentence({ category, preferredPhrases = [] }) {
  if (!NEBIUS_API_KEY) {
    return pickFallback(category, preferredPhrases);
  }

  try {
    const res = await fetch(`${NEBIUS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NEBIUS_API_KEY}`,
      },
      body: JSON.stringify({
        model: NEBIUS_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(category, preferredPhrases) },
        ],
        temperature: 0.7,
        max_tokens: 40,
      }),
    });

    if (!res.ok) {
      throw new Error(`Nebius responded with ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '');
    return text || pickFallback(category, preferredPhrases);
  } catch (err) {
    console.error('[ai] Nebius call failed, using fallback sentence:', err.message);
    return pickFallback(category, preferredPhrases);
  }
}

function buildPrompt(category, preferredPhrases) {
  const memoryLine = preferredPhrases.length
    ? `This patient has previously said, for this category: ${preferredPhrases.map((p) => `"${p}"`).join(', ')}. Prefer similar wording if it fits.`
    : 'No prior phrases are known for this category yet.';
  return `Category: ${category}\n${memoryLine}\nGenerate the sentence now.`;
}

function pickFallback(category, preferredPhrases) {
  if (preferredPhrases.length) return preferredPhrases[0];
  const options = FALLBACK_SENTENCES[category] || ["I need your attention, please."];
  return options[Math.floor(Math.random() * options.length)];
}
