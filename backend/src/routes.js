import express from 'express';
import { analyzeQuestion, computeVisibilityScore } from './llm.js';
import { saveAnalysis, loadDashboard } from './db.js';

export const router = express.Router();

// POST /api/analyze
// Body: { question: string, brands: string[] }
router.post('/analyze', async (req, res) => {
  try {
    const { question, brands } = req.body;

if (!question) {
  return res.status(400).json({ error: 'question is required' });
}

// Default to empty array if no brands provided — model will suggest them
const brandList = brands && Array.isArray(brands) ? brands : [];

    if (brands.length > 6) {
      return res.status(400).json({ error: 'Maximum 6 brands per query' });
    }

    // Call LLM
   const { answerText, brandResults, suggestedBrands } = await analyzeQuestion(question, brandList);
    // Enrich with scores
    const scored = computeVisibilityScore(brandResults);

    // Persist to Neo4j
    const questionId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await saveAnalysis({
      questionId,
      questionText: question,
      answerText,
      brands,
      brandResults: scored
    });

    res.json({
      questionId,
      question,
      answerText,
      brandResults: scored,
      suggestedBrands
    });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/dashboard
// Returns all past questions with brand visibility scores
router.get('/dashboard', async (req, res) => {
  try {
    const data = await loadDashboard();
    res.json(data);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
