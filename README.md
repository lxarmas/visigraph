# Visigraph

**AI Brand Visibility Tracker** — see how your brand appears when an AI answers questions about your market.

🔗 **Live demo:** [visigraph.vercel.app](https://visigraph.vercel.app)

---

## The Problem

Traditional SEO tracks where your brand ranks in search results. But as AI assistants replace search for buying decisions, a new question emerges:

> *"When someone asks an AI about your category — does your brand even get mentioned?"*

Visigraph measures that. Ask any competitive question, track up to six brands, and see who the AI recommends, who gets ignored, and with what sentiment.

---

## How It Works

1. **Ask a question** — e.g. *"What are the best CRM tools for B2B sales?"*
2. **Add brands to track** — e.g. Salesforce, HubSpot, Pipedrive
3. **Run analysis** — the AI answers the question naturally
4. **See visibility scores** — each brand is scored 0–10 based on whether it was mentioned and with what sentiment

---

## Architecture

```
┌─────────────────────┐        ┌──────────────────────┐
│   React (Vite)      │  HTTP  │   Node.js (Express)  │
│   Vercel            │ ──────▶│   Render             │
│ visigraph.vercel.app│        │ visigraph-api.onrender│
└─────────────────────┘        └──────────┬───────────┘
                                          │
                         ┌────────────────┼────────────────┐
                         │                                  │
                 ┌───────▼──────┐                 ┌────────▼──────┐
                 │  Groq API    │                 │  Neo4j Aura   │
                 │  LLaMA 3.3   │                 │  Graph DB     │
                 └──────────────┘                 └───────────────┘
```

---

## Neo4j Graph Model

Every analysis creates a graph of nodes and relationships:

```
(:Question)-[:HAS_ANSWER]->(:Answer)-[:MENTIONED {sentiment, context}]->(:Brand)
                                    -[:NOT_MENTIONED]->(:Brand)

(:Brand)-[:COMPARED_TO {questionId}]-(:Brand)
```

**Why a graph database?**
The core insight lives in the *relationships* — not the data itself. Neo4j lets us ask powerful questions like:

- Which brands are always mentioned together?
- Which competitor does the AI recommend instead of my brand?
- How has brand X's visibility changed across different question phrasings?

These queries are one line in Cypher. In SQL they'd require multiple joins.

---

## Visibility Scoring

| Score | Meaning |
|-------|---------|
| 10 | Mentioned with positive sentiment |
| 7 | Mentioned with neutral sentiment |
| 1 | Mentioned with negative sentiment |
| 0 | Not mentioned at all |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite | Fast dev experience, component model |
| Backend | Node.js + Express | Lightweight, great SDK support |
| LLM | Groq (LLaMA 3.3 70B) | Fast inference, generous free tier |
| Database | Neo4j Aura | Natural fit for relationship-heavy data |
| Frontend deploy | Vercel | Zero-config React deployment |
| Backend deploy | Render | Simple Node.js hosting, free tier |

---

## Project Structure

```
visigraph/
├── backend/
│   ├── src/
│   │   ├── index.js      # Express server + Neo4j init
│   │   ├── routes.js     # POST /analyze, GET /dashboard
│   │   ├── llm.js        # Groq API call + brand/sentiment parser
│   │   └── db.js         # Neo4j driver + graph read/write
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx       # Full UI — analyze + dashboard views
    │   └── main.jsx      # React entry point
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## API Reference

### `POST /api/analyze`

```json
{
  "question": "What are the best CRM tools for B2B sales?",
  "brands": ["Salesforce", "HubSpot", "Pipedrive"]
}
```

**Response:**
```json
{
  "questionId": "q_1234_abc",
  "question": "...",
  "answerText": "When evaluating CRM tools...",
  "brandResults": [
    { "brand": "Salesforce", "mentioned": true, "sentiment": "positive", "score": 10 },
    { "brand": "HubSpot",    "mentioned": true, "sentiment": "neutral",  "score": 7  },
    { "brand": "Pipedrive",  "mentioned": false, "sentiment": "neutral", "score": 0  }
  ]
}
```

### `GET /api/dashboard`

Returns all past analyses with brand mention data from Neo4j.

### `GET /api/health`

Returns `{ "status": "ok" }` — used to verify the backend is running.

---

## Local Setup

### Prerequisites
- Node.js 18+
- Neo4j Aura account (free tier) — [console.neo4j.io](https://console.neo4j.io)
- Groq API key (free) — [console.groq.com](https://console.groq.com)

### 1. Clone the repo
```bash
git clone https://github.com/lxarmas/visigraph.git
cd visigraph
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your keys in .env
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Environment Variables

**`backend/.env`**
```
GROQ_API_KEY=your_groq_api_key
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USER=your_instance_id
NEO4J_PASSWORD=your_password
PORT=3001
```

---

## What I'd Build Next

- **Multi-model comparison** — run the same question through GPT-4o, Claude, and Gemini. Compare which brands each model favors.
- **Scheduled tracking** — run queries daily and track visibility score trends over time in Neo4j
- **Prompt variations** — automatically rephrase the same question 5 different ways and average the scores
- **Graph analytics** — use Neo4j's graph algorithms to find the most "central" brands across all queries

---

## Why This Matters

As AI assistants become the primary discovery layer for purchasing decisions, brand visibility in AI responses is the next frontier of marketing analytics. Visigraph is a proof of concept for that measurement layer.
