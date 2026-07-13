import { Router } from 'express';
import { runPipeline } from './services/band.js';
import { normalizeCategory, CATEGORIES } from './services/ai.js';
import { getHistory, recordInteraction } from './services/memory.js';
import { caregiverSearch } from './services/nimble.js';

const router = Router();

// Category -> { suggestions, preferredPhrases } via the BAND pipeline
// (Vision -> Memory -> Communication agents).
router.post('/category', async (req, res) => {
  const { category: rawCategory, context, language, patientId } = req.body;
  if (!rawCategory) return res.status(400).json({ error: 'category is required' });

  const category = normalizeCategory(rawCategory);
  if (!category) {
    return res.status(422).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
  }

  try {
    const result = await runPipeline({ category, context, language, patientId });
    res.json(result);
  } catch (err) {
    console.error('[routes] /category failed:', err);
    res.status(500).json({ error: 'Failed to generate a response.' });
  }
});

// Explicitly persist an interaction (e.g. if the frontend edits the sentence
// before speaking it).
router.post('/save', (req, res) => {
  const { category, sentence, patientId } = req.body;
  if (!category || !sentence) {
    return res.status(400).json({ error: 'category and sentence are required' });
  }
  recordInteraction({ category, sentence, patientId });
  res.json({ ok: true });
});

router.get('/history', (req, res) => {
  const { patientId } = req.query;
  res.json(getHistory({ patientId }));
});

// Caregiver tab: nearby rehab centers / recovery exercises via Nimble.
router.post('/caregiver', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query is required' });

  const result = await caregiverSearch({ query });
  res.json(result);
});

export default router;
