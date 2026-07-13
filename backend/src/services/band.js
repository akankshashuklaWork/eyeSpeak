// Person 3 owns this file: agent orchestration.
//
// Stand-in for a BAND workflow: Vision Agent -> Memory Agent -> Communication Agent.
// Each "agent" is just a function here — replace runPipeline's internals with
// real BAND agent calls once that's wired up, but keep the same input/output shape
// so routes.js doesn't need to change.

import { getPreferredPhrases, recordInteraction } from './memory.js';
import { generateSuggestions } from './ai.js';

export async function runPipeline({ category, context, language, patientId }) {
  // Vision Agent: the category has already been resolved client-side by
  // eye-gaze dwell selection (Person 1). This step just validates it.
  const visionResult = { category };

  // Memory Agent: look up how this patient usually phrases this category.
  const preferredPhrases = getPreferredPhrases({ patientId, category: visionResult.category });

  // Communication Agent: generate three ranked phrases, informed by memory.
  const { suggestions, source, model } = await generateSuggestions({
    category: visionResult.category,
    context,
    preferredPhrases,
    language,
  });

  // Persist this interaction so future requests benefit from it.
  recordInteraction({ patientId, category: visionResult.category, sentence: suggestions[0] });

  return { category: visionResult.category, suggestions, source, model, preferredPhrases };
}
