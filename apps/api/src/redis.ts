import { createClient, RedisClientType } from "redis";

import { env } from "./env";

export type RedisClient = RedisClientType | null;

let redisClient: RedisClient = null;

if (env.REDIS_URL) {
  redisClient = createClient({
    url: env.REDIS_URL,
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client error", err);
  });

  redisClient.on("connect", () => {
    console.log("Redis Client connected");
  });

  redisClient.on("reconnecting", () => {
    console.log("Redis Client reconnecting...");
  });

  redisClient.connect().catch((err) => {
    console.error("Redis Client connection error", err);
    redisClient = null;
  });
} else {
  console.warn("REDIS_URL not set, rate limiting will use in-memory storage");
}

export { redisClient };
