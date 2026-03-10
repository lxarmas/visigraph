# AI Visibility Tracker

> _"Where does your brand appear when an AI answers a question about your market?"_

A full-stack prototype that wires an LLM, a Node.js API, a React frontend, and Neo4j into an **AI visibility measurement workflow** — built as a 3-day proof of concept.

---

## What It Does

When a user types a competitive question like _"What is the best project management software for remote teams?"_ and selects brands to track (e.g., Notion, Asana, Linear):

1. The backend calls **GPT-4o-mini** with the question
2. It parses the LLM's answer to detect whether each brand was **mentioned**, and if so, with what **sentiment** (positive / neutral / negative)
3. Results are stored in **Neo4j** as a graph: `Question → Answer → Brand` nodes with `MENTIONED`, `NOT_MENTIONED`, and `COMPARED_TO` relationships
4. The frontend shows a live **visibility score** (0–10) per brand and a dashboard of historical queries

---

## Architecture

```
┌─────────────┐    POST /api/analyze     ┌──────────────────┐
│  React UI   │ ──────────────────────→  │  Node.js API      │
│  (Vite)     │ ←──────────────────────  │  (Express)        │
└─────────────┘    JSON: scores + answer └────────┬─────────┘
                                                  │
                             ┌────────────────────┼────────────────────┐
                             │                    │                    │
                      ┌──────▼──────┐    ┌────────▼──────┐   ┌────────▼──────┐
                      │   OpenAI    │    │    Neo4j       │   │  LLM Parser   │
                      │  GPT-4o-mini│    │  Graph DB      │   │  (regex+parse)│
                      └─────────────┘    └───────────────┘   └───────────────┘
```

### Node Graph Model (Neo4j)

```
(:Question {id, text, createdAt})
    -[:HAS_ANSWER]->
(:Answer {id, text, createdAt})
    -[:MENTIONED {sentiment, context}]->  (:Brand {name})
    -[:NOT_MENTIONED]->                   (:Brand {name})

(:Brand)-[:COMPARED_TO {questionId}]-(:Brand)   // when both are mentioned in same answer
```

### Visibility Score (0–10)

| Condition               | Score |
|-------------------------|-------|
| Not mentioned           | 0     |
| Mentioned + negative    | 1     |
| Mentioned + neutral     | 7     |
| Mentioned + positive    | 10    |

---

## Why This Matters for AI Visibility

Traditional SEO tracks _search engine ranking_. As AI assistants replace search for buying decisions, the new question is: **does the model even mention your brand when someone asks about your category?**

This prototype measures:
- **Presence** — was the brand mentioned at all?
- **Sentiment** — was the mention framed positively or negatively?
- **Co-occurrence** — which brands are compared together? (COMPARED_TO graph edges)
- **Trend** — does visibility change across different phrasings or over time?

A real product built on this foundation could track dozens of brands across hundreds of prompt variations, automatically detect when LLM behavior changes after a model update, and correlate AI visibility with pipeline metrics.

---

## Project Structure

```
ai-visibility/
├── backend/
│   ├── src/
│   │   ├── index.js        # Express server + Neo4j init
│   │   ├── routes.js       # POST /analyze, GET /dashboard
│   │   ├── llm.js          # OpenAI call + brand/sentiment parser
│   │   └── db.js           # Neo4j driver + graph write/read
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── main.jsx        # React entry
    │   └── App.jsx         # Full UI (analyze + dashboard views)
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Setup & Running

### Prerequisites

- Node.js 18+
- Neo4j (local via [Neo4j Desktop](https://neo4j.com/download/) or free cloud via [Aura](https://neo4j.com/cloud/platform/aura-graph-database/))
- OpenAI API key

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your OpenAI key and Neo4j credentials
npm run dev
```

Server starts at `http://localhost:3001`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI starts at `http://localhost:5173` (proxies `/api` to port 3001)

### 3. Neo4j

**Option A — Local:**
1. Download Neo4j Desktop
2. Create a new project/database
3. Set a password and copy it to `.env`
4. Default URI: `bolt://localhost:7687`

**Option B — Aura (cloud, free tier):**
1. Sign up at [console.neo4j.io](https://console.neo4j.io)
2. Create a free instance
3. Copy the connection URI and credentials to `.env`

---

## API Reference

### `POST /api/analyze`

```json
{
  "question": "What is the best project management software?",
  "brands": ["Notion", "Asana", "Linear"]
}
```

**Response:**
```json
{
  "questionId": "q_1234_abc",
  "question": "...",
  "answerText": "When evaluating project management tools...",
  "brandResults": [
    { "brand": "Notion", "mentioned": true, "sentiment": "positive", "context": "...", "score": 10 },
    { "brand": "Asana", "mentioned": true, "sentiment": "neutral", "context": "...", "score": 7 },
    { "brand": "Linear", "mentioned": false, "sentiment": "neutral", "context": "", "score": 0 }
  ]
}
```

### `GET /api/dashboard`

Returns all past questions with brand mention data from Neo4j.

---

## Tech Stack

| Layer      | Technology             | Why                                           |
|------------|------------------------|-----------------------------------------------|
| Frontend   | React + Vite           | Fast DX, component model, easy state mgmt     |
| Backend    | Node.js + Express      | Lightweight, great OpenAI/Neo4j SDK support   |
| LLM        | OpenAI GPT-4o-mini     | Cost-effective, strong instruction following  |
| Graph DB   | Neo4j                  | Natural fit for brand relationship graph       |

---

## Day-by-Day Build Plan

**Day 1 — Data Layer**
- Define Neo4j schema: Question, Answer, Brand nodes + relationships
- Stand up Neo4j (local or Aura)
- Write `db.js` with `saveAnalysis()` and `loadDashboard()` queries
- Hard-code 2–3 sample questions and verify round-trip read/write

**Day 2 — LLM Integration + UI**
- Implement `llm.js`: OpenAI call with structured prompt, brand/sentiment parser
- Build `/api/analyze` endpoint wiring LLM → parser → Neo4j
- Build React frontend: question input, brand chips, score table

**Day 3 — Polish**
- Loading states, error handling
- Dashboard view with historical queries
- Seed 5 example questions
- Write this README

---

## Extending This

- **Prompt variations**: Run the same question through 5 different phrasings — does brand visibility change?
- **Model comparison**: Run the same query across GPT-4o, Claude, Gemini — compare which brands each model favors
- **Time series**: Schedule daily queries, track visibility score trends in Neo4j over weeks
- **Graph queries**: Use Cypher to find "which brands are always mentioned together?" or "which brand has the highest positive-to-negative ratio?"
