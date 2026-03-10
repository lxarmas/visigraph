import OpenAI from 'openai';

let openai;

function getClient() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

/**
 * Call the LLM with the question, then parse brand mentions + sentiment.
 * Returns: { answerText, brandResults[] }
 */
export async function analyzeQuestion(question, brands) {
  const brandList = brands.join(', ');

  const systemPrompt = `You are an expert market analyst specializing in AI visibility and brand perception.
When asked a question, provide a thoughtful, informative answer as if you were a knowledgeable consultant.
Your answers should be realistic and reflect actual market conditions.`;

  const userPrompt = `Question: "${question}"

Please answer this question naturally and informatively in 2-4 paragraphs.

Then, after your answer, add a special analysis section using EXACTLY this format:

---BRAND_ANALYSIS---
${brands.map(b => `${b}: [MENTIONED or NOT_MENTIONED] | [positive/negative/neutral] | [brief context or "not applicable"]`).join('\n')}
---END_ANALYSIS---

Brands to analyze: ${brandList}`;

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 1200
  });

  const fullText = response.choices[0].message.content;

  // Split answer from analysis block
  const parts = fullText.split('---BRAND_ANALYSIS---');
  const answerText = parts[0].trim();
  const analysisBlock = parts[1]?.split('---END_ANALYSIS---')[0]?.trim() || '';

  // Parse brand results
  const brandResults = parseBrandAnalysis(analysisBlock, brands);

  return { answerText, brandResults };
}

function parseBrandAnalysis(analysisBlock, brands) {
  const lines = analysisBlock.split('\n').filter(l => l.trim());
  const results = [];

  for (const brand of brands) {
    const line = lines.find(l => l.toLowerCase().startsWith(brand.toLowerCase() + ':'));

    if (!line) {
      results.push({ brand, mentioned: false, sentiment: 'neutral', context: 'Not analyzed' });
      continue;
    }

    const parts = line.split('|').map(p => p.trim());
    const statusPart = parts[0] || '';
    const sentimentPart = parts[1] || 'neutral';
    const contextPart = parts[2] || '';

    const mentioned = statusPart.toUpperCase().includes('MENTIONED') &&
      !statusPart.toUpperCase().includes('NOT_MENTIONED');

    const sentimentRaw = sentimentPart.toLowerCase();
    let sentiment = 'neutral';
    if (sentimentRaw.includes('positive')) sentiment = 'positive';
    else if (sentimentRaw.includes('negative')) sentiment = 'negative';

    results.push({
      brand,
      mentioned,
      sentiment,
      context: contextPart === 'not applicable' ? '' : contextPart
    });
  }

  return results;
}

/**
 * Generate a visibility score for a brand (0–10 scale)
 * Based on mention + sentiment
 */
export function computeVisibilityScore(brandResults) {
  return brandResults.map(r => {
    let score = 0;
    if (r.mentioned) {
      score += 5;
      if (r.sentiment === 'positive') score += 5;
      else if (r.sentiment === 'neutral') score += 2;
      else if (r.sentiment === 'negative') score += 1;
    }
    return { ...r, score };
  });
}
