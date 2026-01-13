import { apiReference } from "@scalar/express-api-reference";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import pino from "pino";
import pinoHttp from "pino-http";

import { authRouter } from "./auth/routes";
import { prisma } from "./db";
import { env } from "./env";
import { googlePlaceRouter } from "./google-place/routes";
import { listRouter } from "./list/routes";
import { poiRouter } from "./poi/routes";
import { sharedRouter } from "./shared/routes";
import { SwaggerSpec } from "./swagger";
import { ErrorCode, ErrorCodes } from "./utils/error-codes";
import { ApiError, formatError } from "./utils/errors";

export function createServer() {
  const app = express();

  const logger = pino({
    level: env.LOG_LEVEL,
  });
  app.use(pinoHttp({ logger }));

  // app.use(helmet());
  app.use((req, res, next) => {
    if (req.path.startsWith("/docs")) {
      return next();
    }
    helmet()(req, res, next);
  });

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use(
    "/docs",
    apiReference({
      spec: {
        url: "/docs.json",
      },
      authentication: {
        preferredSecurityScheme: "bearerAuth",
        http: {
          bearer: {
            token: "",
          },
        },
      },
      slug: "api-1",
      title: "Nirby API",
      layout: "modern",
      defaultOpenAllTags: true,
      documentDownloadType: "none",
      // favicon: ''
      hideClientButton: true,
      persistAuth: true,
      telemetry: true,
      showSidebar: true,
      showDeveloperTools: "never",
      theme: "deepSpace",

      isEditable: false,
      _integration: "express",
      default: false,
    })
  );

  app.get("/docs.json", (_req, res) => res.json(SwaggerSpec));

  app.use("/auth", authRouter);
  app.use("/poi", poiRouter);
  app.use("/list", listRouter);
  app.use("/google-place", googlePlaceRouter);
  app.use("/shared", sharedRouter);

  if (env.NODE_ENV === "test") {
    app.get("/test-error", (_req: Request, _res: Response, next: NextFunction) => {
      next(new Error("Test generic error"));
    });
  }

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Health check
   *     tags:
   *       - ❤️ Health
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
   *     tags:
   *       - ❤️ Health
   *     responses:
   *       200:
   *         description: Database is alive
   */
  app.get("/db/health", async (_req, res) => {
    const now = await prisma.$queryRaw`select now() as now`;
    res.json({ ok: true, db: now });
  });

  app.use((req: Request, res: Response) => {
    res.status(404).json(formatError(ErrorCodes.NOT_FOUND, "Not Found"));
  });

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    req.log?.error({ err }, "Unhandled error");

    if (err instanceof ApiError) {
      return res
        .status(err.statusCode)
        .json(formatError(err.code as ErrorCode, err.message, err.details));
    }

    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  });

  return app;
}
