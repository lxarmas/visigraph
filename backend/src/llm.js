import Groq from 'groq-sdk';

let groq;

function getClient() {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

export async function analyzeQuestion(question, brands) {
  // If no brands provided, ask the model to suggest them first
  if (!brands || brands.length === 0) {
    brands = await suggestBrands(question);
  }

  const brandList = brands.join(', ');

  const response = await getClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1200,
    messages: [
      {
        role: 'system',
        content: `You are an expert market analyst specializing in AI visibility and brand perception.
When asked a question, provide a thoughtful, informative answer as if you were a knowledgeable consultant.`
      },
      {
        role: 'user',
        content: `Question: "${question}"

Please answer this question naturally in 2-4 paragraphs.

Then add this analysis section using EXACTLY this format:

---BRAND_ANALYSIS---
${brands.map(b => `${b}: [MENTIONED or NOT_MENTIONED] | [positive/negative/neutral] | [brief context or "not applicable"]`).join('\n')}
---END_ANALYSIS---

Brands to analyze: ${brandList}`
      }
    ]
  });

  const fullText = response.choices[0].message.content;
  console.log('RAW LLM OUTPUT:', fullText);

  const parts = fullText.split('---BRAND_ANALYSIS---');
  const answerText = parts[0].trim();
  const analysisBlock = parts[1]?.split('---END_ANALYSIS---')[0]?.trim() || '';
  const brandResults = parseBrandAnalysis(analysisBlock, brands);

  // Return suggested brands so frontend can display them
  return { answerText, brandResults, suggestedBrands: brands };
}

// New function — asks the model to suggest relevant brands
async function suggestBrands(question) {
  const response = await getClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content: `You are a market research expert. When given a question, suggest the 6 most relevant brand names to track. Return ONLY a JSON array of brand name strings. No explanation, no markdown, just the array.`
      },
      {
        role: 'user',
        content: `Question: "${question}"
        
Return exactly 6 brand names as a JSON array like: ["Brand1", "Brand2", "Brand3", "Brand4", "Brand5", "Brand6"]`
      }
    ]
  });

  try {
    const text = response.choices[0].message.content.trim();
    const parsed = JSON.parse(text);
    return parsed.slice(0, 6);
  } catch (e) {
    console.error('Failed to parse suggested brands:', e);
    return [];
  }
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