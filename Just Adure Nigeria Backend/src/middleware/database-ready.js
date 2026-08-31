import { connectMongo, isMongoReady } from "../config/mongo.js";
import { AppError } from "../errors/app-error.js";

let reconnectPromise = null;

async function tryReconnect() {
  if (!reconnectPromise) {
    reconnectPromise = connectMongo(false).finally(() => {
      reconnectPromise = null;
    });
  }

  return reconnectPromise;
}

export async function requireDatabaseReady(_request, _response, next) {
  if (isMongoReady()) {
    next();
    return;
  }

  await tryReconnect();

  if (isMongoReady()) {
    next();
    return;
  }

  next(new AppError(503, "DATABASE_UNAVAILABLE", "Database connection is not ready. Please check MongoDB and restart the backend."));
}