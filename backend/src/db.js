import neo4j from 'neo4j-driver';

let driver;

function createDriver() {
  return neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || 'password'
    ),
    {
      maxConnectionLifetime: 3 * 60 * 60 * 1000,   // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 10_000,
      connectionLivenessCheckTimeout: 1_000,         // ✅ detect stale connections fast
    }
  );
}

export function getDriver() {
  if (!driver) {
    driver = createDriver();
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
 * Runs a function with a Neo4j session, auto-reconnecting if the
 * routing table has expired (the "No routing servers available" error).
 */
async function withSession(fn) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const session = getDriver().session();
      try {
        return await fn(session);
      } finally {
        await session.close();
      }
    } catch (err) {
      const isStale =
        err.message?.includes('No routing servers available') ||
        err.message?.includes('Could not perform discovery') ||
        err.code === 'ServiceUnavailable';

      if (isStale && attempt < 2) {
        console.warn(`Neo4j routing stale, reconnecting (attempt ${attempt + 1})…`);
        await closeDriver();           // tear down dead driver
        driver = createDriver();       // fresh driver with new routing table
        await driver.verifyConnectivity();
        continue;
      }
      throw err;
    }
  }
}

/**
 * Initialize schema constraints
 */
export async function initSchema() {
  await withSession(async (session) => {
    await session.run(`CREATE CONSTRAINT question_id IF NOT EXISTS FOR (q:Question) REQUIRE q.id IS UNIQUE`);
    await session.run(`CREATE CONSTRAINT brand_name IF NOT EXISTS FOR (b:Brand) REQUIRE b.name IS UNIQUE`);
    await session.run(`CREATE CONSTRAINT answer_id IF NOT EXISTS FOR (a:Answer) REQUIRE a.id IS UNIQUE`);
    console.log('✅ Neo4j schema initialized');
  }).catch(err => console.warn('Schema init warning:', err.message));
}

/**
 * Save a full analysis result to Neo4j
 * Creates: Question → Answer → Brand nodes + relationships
 */
export async function saveAnalysis({ questionId, questionText, answerText, brands, brandResults }) {
  return withSession(async (session) => {
    const answerId = `answer_${Date.now()}`;
    const timestamp = new Date().toISOString();

    await session.run(
      `MERGE (q:Question {id: $questionId})
       ON CREATE SET q.text = $questionText, q.createdAt = $timestamp
       ON MATCH SET q.lastAskedAt = $timestamp`,
      { questionId, questionText, timestamp }
    );

    await session.run(
      `MATCH (q:Question {id: $questionId})
       CREATE (a:Answer {id: $answerId, text: $answerText, createdAt: $timestamp})
       CREATE (q)-[:HAS_ANSWER]->(a)`,
      { questionId, answerId, answerText, timestamp }
    );

    for (const result of brandResults) {
      const { brand, mentioned, sentiment, context } = result;
      const relType = mentioned ? 'MENTIONED' : 'NOT_MENTIONED';

      await session.run(
        `MERGE (b:Brand {name: $brand})
         WITH b
         MATCH (a:Answer {id: $answerId})
         CREATE (a)-[:${relType} {sentiment: $sentiment, context: $context, createdAt: $timestamp}]->(b)`,
        { brand, sentiment: sentiment || 'neutral', context: context || '', answerId, timestamp }
      );
    }

    return { questionId, answerId };
  });
}

/**
 * Load all past questions with aggregated brand scores
 */
export async function loadDashboard() {
  return withSession(async (session) => {
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
  });
}
