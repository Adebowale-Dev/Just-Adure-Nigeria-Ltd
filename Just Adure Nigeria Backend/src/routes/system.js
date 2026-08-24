import { Router } from "express";
import { isMongoReady } from "../config/mongo.js";
export const systemRouter = Router();
/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Check process liveness
 *     responses:
 *       200:
 *         description: API process is alive
 */
systemRouter.get("/health", (_request, response) => {
    response.json({
        data: {
            status: "ok",
            service: "just-adure-api",
            timestamp: new Date().toISOString(),
        },
    });
});
/**
 * @openapi
 * /ready:
 *   get:
 *     tags: [System]
 *     summary: Check required dependencies
 *     responses:
 *       200:
 *         description: Dependencies are ready
 *       503:
 *         description: A dependency is unavailable
 */
systemRouter.get("/ready", async (_request, response) => {
    const checks = { mongodb: isMongoReady() };
    const ready = checks.mongodb;
    response.status(ready ? 200 : 503).json({
        data: { status: ready ? "ready" : "not_ready", checks },
        requestId: response.locals.requestId,
    });
});
