// Person 2 owns this file: Nebius-hosted LLM sentence generation.
//
// Category -> three ranked, natural first-person phrases. If NEBIUS_API_KEY
// is unset, the call fails, or the model's output can't be parsed into
// exactly three phrases, falls back to canned phrases so the rest of the
// demo keeps working.

const NEBIUS_API_KEY = process.env.NEBIUS_API_KEY;
const NEBIUS_BASE_URL = process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1';
const NEBIUS_MODEL = process.env.NEBIUS_MODEL || 'Qwen/Qwen3-30B-A3B-Instruct-2507';

export const CATEGORIES = ['water', 'food', 'bathroom', 'family', 'emergency'];

const SYSTEM_PROMPT = `You generate communication phrases for an assistive communication application.

The user may have paralysis, aphasia, or limited motor control and may communicate
through eye-gaze selection.

Generate exactly three short phrases that the user could choose and speak aloud.

Rules:
1. Return valid JSON only.
2. Use this exact structure:
   {"suggestions": ["phrase 1", "phrase 2", "phrase 3"]}
3. Each phrase must be no longer than 12 words.
4. Each phrase must be clear, respectful, and spoken in first person.
5. Keep phrases meaningfully different.
6. Prefer direct communication over unnecessary politeness.
7. Do not diagnose conditions.
8. Do not give medical instructions.
9. Do not invent symptoms, medication names, people, or personal facts.
10. For emergency requests, use direct phrases requesting immediate help.
11. Consider preferred phrases when provided, but do not blindly copy irrelevant ones.
12. Write in the requested language.`;

const FALLBACK_SUGGESTIONS = {
  water: ['I am thirsty.', 'Please give me some water.', 'I need help drinking.'],
  food: ['I am hungry.', 'Please help me eat.', 'I am finished eating.'],
  bathroom: ['I need to use the bathroom.', 'Please help me go to the bathroom.', 'I need assistance now.'],
  family: ['Please call my family.', 'I want to speak with my family.', 'Is my family nearby?'],
  emergency: ['I need help immediately.', 'Please call my caregiver now.', 'This is an emergency.'],
};

// Normalizes casing/whitespace (" Water " / "EMERGENCY" -> "water"). Returns
// null if the category isn't one of the five supported categories, so
// callers can reject with HTTP 422.
export function normalizeCategory(rawCategory) {
  if (typeof rawCategory !== 'string') return null;
  const normalized = rawCategory.trim().toLowerCase();
  return CATEGORIES.includes(normalized) ? normalized : null;
}

export async function generateSuggestions({ category, context, preferredPhrases = [], language = 'English' }) {
  if (!NEBIUS_API_KEY) {
    return { suggestions: getFallbackSuggestions(category), source: 'fallback', model: null };
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
        temperature: 0.3,
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt({ category, context, preferredPhrases, language }) },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Nebius responded with ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Nebius returned an empty response.');

    const suggestions = cleanSuggestions(extractJsonObject(content)?.suggestions);
    return { suggestions, source: 'nebius', model: NEBIUS_MODEL };
  } catch (err) {
    console.error('[ai] Nebius call failed, using fallback suggestions:', err.message);
    return { suggestions: getFallbackSuggestions(category), source: 'fallback', model: null };
  }
}

function buildUserPrompt({ category, context, preferredPhrases, language }) {
  const payload = { category, context: context ?? null, preferred_phrases: preferredPhrases, language };
  return `Generate three communication suggestions using this input:\n${JSON.stringify(payload)}`;
}

function extractJsonObject(content) {
  try {
    return JSON.parse(content);
  } catch {
    // Non-greedy: some models loop and repeat the JSON block until they hit
    // max_tokens (finish_reason: "length"), producing several JSON objects
    // back to back. A greedy match would span all of them into one invalid
    // blob, so grab just the first well-formed object instead.
    const match = content.match(/\{[\s\S]*?\]\s*\}?/);
    if (!match) throw new Error('The model did not return valid JSON.');

    try {
      return JSON.parse(match[0]);
    } catch {
      // Truncation sometimes lands mid-token and drops the final closing
      // brace (e.g. "...\"]" with no trailing "}"). Repair by appending one.
      return JSON.parse(`${match[0].replace(/\}?$/, '')}}`);
    }
  }
}

function cleanSuggestions(rawSuggestions) {
  if (!Array.isArray(rawSuggestions)) throw new Error('Suggestions must be a list.');

  const cleaned = [];
  for (const item of rawSuggestions) {
    if (typeof item !== 'string') continue;

    let phrase = item.trim().replace(/\s+/g, ' ').replace(/^["']|["']$/g, '');
    if (!phrase) continue;

    const words = phrase.split(' ');
    if (words.length > 12) phrase = words.slice(0, 12).join(' ');

    if (!cleaned.includes(phrase)) cleaned.push(phrase);
  }

  if (cleaned.length !== 3) throw new Error('The model must return exactly three unique suggestions.');
  return cleaned;
}

function getFallbackSuggestions(category) {
  return FALLBACK_SUGGESTIONS[category] || FALLBACK_SUGGESTIONS.water;
}
