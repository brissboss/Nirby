import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { dbPool } from './db/pool';
import { swaggerSpec } from './config/swagger';

const app = express();
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Checks if the API and database are working correctly
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 db:
 *                   type: boolean
 *                   example: true
 *                 env:
 *                   type: string
 *                   example: development
 *       500:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: DB connection failed
 */
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
