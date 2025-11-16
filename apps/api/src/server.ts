import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import pino from "pino";
import pinoHttp from "pino-http";

import { prisma } from "./db";

export function createServer() {
  const app = express();

  const logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
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

  // health check
  app.get("/health", (req: Request, res: Response) => {
    res.json({ ok: true, service: "api", time: new Date().toISOString() });
  });

  // db health check
  app.get("/db/health", async (_req, res) => {
    const now = await prisma.$queryRaw`select now() as now`;
    res.json({ ok: true, db: now });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
  });

  // error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    req.log?.error({ err }, "Unhandled error");
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}
