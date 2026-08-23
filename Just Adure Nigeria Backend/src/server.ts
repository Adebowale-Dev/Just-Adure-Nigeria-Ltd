import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import { connectRedis, redis } from "./config/redis.js";

async function start() {
  await prisma.$connect();
  await connectRedis();

  const server = createServer(app);
  server.listen(env.API_PORT, () => {
    logger.info(
      { port: env.API_PORT, environment: env.NODE_ENV },
      "Just Adure Nigeria Ltd API is listening",
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Graceful shutdown started");
    server.close(async () => {
      await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

start().catch((error: unknown) => {
  logger.fatal({ error }, "API failed to start");
  process.exit(1);
});
