import { env } from "./env";
import { createServer } from "./server";

const app = createServer();

app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}`);
});
