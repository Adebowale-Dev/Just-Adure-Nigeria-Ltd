import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { printMongoAttempt, printMongoConnected } from "../utils/terminal-banner.js";
export async function connectMongo(required = env.NODE_ENV === "production") {
    if (mongoose.connection.readyState === 1) {
        return true;
    }
    try {
        printMongoAttempt();
        await mongoose.connect(env.MONGODB_URL, {
            serverSelectionTimeoutMS: env.NODE_ENV === "production" ? 30_000 : 2_000,
        });
        printMongoConnected();
        return true;
    }
    catch (error) {
        if (required) {
            throw error;
        }
        logger.warn({ error }, "MongoDB is unavailable; continuing without MongoDB in development");
        return false;
    }
}
export async function disconnectMongo() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
}
export function isMongoReady() {
    return mongoose.connection.readyState === 1;
}

