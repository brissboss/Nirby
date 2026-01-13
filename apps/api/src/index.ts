import { env } from "./env";
import { redisClient } from "./redis";
import { createServer } from "./server";

const app = createServer();

app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}`);

  if (redisClient) {
    console.log("[redis] Rate limiting using Redis store");
  } else {
    console.warn("[redis] Rate limiting using in-memory storage (REDIS_URL not set)");
  }
});
