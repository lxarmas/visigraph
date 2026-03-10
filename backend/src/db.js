import neo4j from 'neo4j-driver';

let driver;

export function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
      )
    );
  }
  return driver;
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/**
 * Initialize schema constraints
 */
export async function initSchema() {
  const session = getDriver().session();
  try {
    await session.run(`CREATE CONSTRAINT question_id IF NOT EXISTS FOR (q:Question) REQUIRE q.id IS UNIQUE`);
    await session.run(`CREATE CONSTRAINT brand_name IF NOT EXISTS FOR (b:Brand) REQUIRE b.name IS UNIQUE`);
    await session.run(`CREATE CONSTRAINT answer_id IF NOT EXISTS FOR (a:Answer) REQUIRE a.id IS UNIQUE`);
    console.log('✅ Neo4j schema initialized');
  } catch (err) {
    console.warn('Schema init warning:', err.message);
  } finally {
    await session.close();
  }
}

/**
 * Save a full analysis result to Neo4j
 * Creates: Question → Answer → Brand nodes + relationships
 */
export async function saveAnalysis({ questionId, questionText, answerText, brands, brandResults }) {
  const session = getDriver().session();
  const answerId = `answer_${Date.now()}`;
  const timestamp = new Date().toISOString();

  try {
    // Merge Question node
    await session.run(
      `MERGE (q:Question {id: $questionId})
       ON CREATE SET q.text = $questionText, q.createdAt = $timestamp
       ON MATCH SET q.lastAskedAt = $timestamp, q.askCount = coalesce(q.askCount, 0) + 1`,
      { questionId, questionText, timestamp }
    );

    // Create Answer node
    await session.run(
      `CREATE (a:Answer {id: $answerId, text: $answerText, createdAt: $timestamp})
       WITH a
       MATCH (q:Question {id: $questionId})
       CREATE (q)-[:HAS_ANSWER]->(a)`,
      { answerId, answerText, timestamp }
    );

    // For each brand: merge Brand node + create relationship to Answer
    for (const result of brandResults) {
      const { brand, mentioned, sentiment, context } = result;
      const relType = mentioned ? 'MENTIONED' : 'NOT_MENTIONED';

      await session.run(
        `MERGE (b:Brand {name: $brand})
         WITH b
         MATCH (a:Answer {id: $answerId})
         CREATE (a)-[r:${relType} {sentiment: $sentiment, context: $context, createdAt: $timestamp}]->(b)`,
        { brand, sentiment: sentiment || 'neutral', context: context || '', timestamp }
      );
    }

    // Create COMPARED_TO relationships between brands that are both mentioned
    const mentionedBrands = brandResults.filter(r => r.mentioned).map(r => r.brand);
    if (mentionedBrands.length > 1) {
      for (let i = 0; i < mentionedBrands.length; i++) {
        for (let j = i + 1; j < mentionedBrands.length; j++) {
          await session.run(
            `MATCH (b1:Brand {name: $brand1}), (b2:Brand {name: $brand2})
             MERGE (b1)-[:COMPARED_TO {questionId: $questionId}]-(b2)`,
            { brand1: mentionedBrands[i], brand2: mentionedBrands[j], questionId }
          );
        }
      }
    }

    return { questionId, answerId };
  } finally {
    await session.close();
  }
}

/**
 * Load all past questions with aggregated brand scores
 */
export async function loadDashboard() {
  const session = getDriver().session();
  try {
    const result = await session.run(`
      MATCH (q:Question)-[:HAS_ANSWER]->(a:Answer)
      OPTIONAL MATCH (a)-[rel]->(b:Brand)
      RETURN q.id AS questionId,
             q.text AS questionText,
             q.createdAt AS createdAt,
             a.id AS answerId,
             a.text AS answerText,
             a.createdAt AS answeredAt,
             type(rel) AS relType,
             rel.sentiment AS sentiment,
             rel.context AS context,
             b.name AS brandName
      ORDER BY a.createdAt DESC
    `);

    // Group by question
    const questionsMap = new Map();
    for (const record of result.records) {
      const qId = record.get('questionId');
      const answerId = record.get('answerId');

      if (!questionsMap.has(answerId)) {
        questionsMap.set(answerId, {
          questionId: qId,
          questionText: record.get('questionText'),
          createdAt: record.get('answeredAt') || record.get('createdAt'),
          answerId,
          answerText: record.get('answerText'),
          brands: []
        });
      }

      const brandName = record.get('brandName');
      if (brandName) {
        questionsMap.get(answerId).brands.push({
          name: brandName,
          mentioned: record.get('relType') === 'MENTIONED',
          sentiment: record.get('sentiment'),
          context: record.get('context')
        });
      }
    }

    return Array.from(questionsMap.values());
  } finally {
    await session.close();
  }
}
