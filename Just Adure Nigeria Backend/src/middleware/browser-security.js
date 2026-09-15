import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const trustedOrigin = new URL(env.WEB_URL).origin;

export function isTrustedOrigin(origin) {
  return origin === trustedOrigin;
}

export function protectBrowserWrites(request, _response, next) {
  if (safeMethods.has(request.method)) return next();

  const origin = request.get("Origin");
  if ((origin && !isTrustedOrigin(origin)) || (!origin && request.get("Sec-Fetch-Site") === "cross-site")) {
    return next(new AppError(403, "UNTRUSTED_ORIGIN", "This request origin is not allowed."));
  }

  // A custom header cannot be added by cross-origin HTML forms. CORS must stay strict.
  const hasSession = Boolean(request.cookies?.ja_access_token || request.cookies?.ja_refresh_token);
  if ((origin || (hasSession && env.NODE_ENV === "production")) && request.get("X-CSRF-Token") !== "1") {
    return next(new AppError(403, "CSRF_PROTECTION", "The request could not be verified. Please refresh the page."));
  }

  return next();
}
