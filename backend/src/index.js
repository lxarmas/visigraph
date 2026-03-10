import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router } from './routes.js';
import { initSchema } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

app.use('/api', router);

// Start server
async function start() {
  try {
    await initSchema();
    app.listen(PORT, () => {
      console.log(`🚀 AI Visibility API running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Analyze: POST http://localhost:${PORT}/api/analyze`);
      console.log(`   Dashboard: GET http://localhost:${PORT}/api/dashboard`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
