import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const redis = createClient({ url: env.REDIS_URL });

redis.on("error", (error) => {
  logger.error({ error }, "Redis client error");
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}
