import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import pino from "pino";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";

import { prisma } from "./db";
import { env } from "./env";
import { SwaggerSpec } from "./swagger";

export function createServer() {
  const app = express();

  const logger = pino({
    level: env.LOG_LEVEL,
  });
  app.use(pinoHttp({ logger }));

  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(SwaggerSpec));

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Health check
   *     responses:
   *       200:
   *         description: API is alive
   */
  app.get("/health", (req: Request, res: Response) => {
    res.json({ ok: true, service: "api", time: new Date().toISOString() });
  });

  /**
   * @openapi
   * /db/health:
   *   get:
   *     summary: Database health check
   *     responses:
   *       200:
   *         description: Database is alive
   */
  app.get("/db/health", async (_req, res) => {
    const now = await prisma.$queryRaw`select now() as now`;
    res.json({ ok: true, db: now });
  });

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
  });

  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    req.log?.error({ err }, "Unhandled error");
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}
