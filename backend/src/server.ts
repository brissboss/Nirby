import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { dbPool } from './db/pool';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    const result = await dbPool.query('SELECT 1');
    res.json({
      ok: true,
      db: result.rows[0]['?column?'] === 1,
      env: env.NODE_ENV,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'DB connection failed' });
  }
});

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
