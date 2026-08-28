import mongoose from "mongoose";
import { env } from "../config/env.js";

function maskMongoUrl(url) {
    return url.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@)/, "$1****$2");
}

function box(lines) {
    const width = Math.max(...lines.map((line) => line.length), 54);
    const border = `+${"-".repeat(width + 2)}+`;
    const body = lines.map((line) => `| ${line.padEnd(width)} |`);
    return [border, ...body, border].join("\n");
}

export function printMongoAttempt() {
    if (env.NODE_ENV !== "development") return;
    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI candidate detected: MONGODB_URL");
    console.log(`Connection string: ${maskMongoUrl(env.MONGODB_URL)}`);
}

export function printMongoConnected() {
    if (env.NODE_ENV !== "development") return;
    const host = mongoose.connection.host || "MongoDB Atlas";
    const database = mongoose.connection.name || "unknown";
    console.log(`[OK] MongoDB Connected: ${host}`);
    console.log(`[OK] Database: ${database}`);
}

export function printStartupBanner() {
    if (env.NODE_ENV !== "development") return;
    console.log("");
    console.log(box([
        "Just Adure Nigeria Ltd - E-commerce API",
        "",
        `Server running on port ${env.API_PORT}`,
        `Environment: ${env.NODE_ENV}`,
        `API: ${env.API_URL}`,
        `API Docs: ${env.API_URL.replace(/\/$/, "")}/api/docs`,
        `OpenAPI JSON: ${env.API_URL.replace(/\/$/, "")}/api/openapi.json`,
    ]));
    console.log("");
}
function safeBody(body) {
    if (!body || typeof body !== "object" || Object.keys(body).length === 0) return "{}";
    const copy = { ...body };
    for (const key of ["password", "token", "accessToken", "refreshToken"]) {
        if (key in copy) copy[key] = "[REDACTED]";
    }
    return JSON.stringify(copy);
}

export function developmentRequestLogger(request, _response, next) {
    if (env.NODE_ENV !== "development") {
        next();
        return;
    }
    console.log("");
    console.log(box([
        new Date().toISOString(),
        `${request.method} ${request.originalUrl}`,
        `Body: ${safeBody(request.body)}`,
    ]));
    console.log("");
    next();
}
