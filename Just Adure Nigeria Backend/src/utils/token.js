import { createHmac, timingSafeEqual } from "node:crypto";
function base64UrlEncode(value) {
    return Buffer.from(value).toString("base64url");
}
function base64UrlDecode(value) {
    return Buffer.from(value, "base64url").toString("utf8");
}
function signContent(content, secret) {
    return createHmac("sha256", secret).update(content).digest("base64url");
}
export function signToken(payload, secret, ttlSeconds) {
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = { ...payload, iat: now, exp: now + ttlSeconds };
    const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = base64UrlEncode(JSON.stringify(tokenPayload));
    const content = `${header}.${body}`;
    const signature = signContent(content, secret);
    return `${content}.${signature}`;
}
export function verifyToken(token, secret, expectedType) {
    const parts = token.split(".");
    if (parts.length !== 3) {
        throw new Error("Invalid token format.");
    }
    const [header, body, signature] = parts;
    const content = `${header}.${body}`;
    const expectedSignature = signContent(content, secret);
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
        throw new Error("Invalid token signature.");
    }
    const payload = JSON.parse(base64UrlDecode(body));
    const now = Math.floor(Date.now() / 1000);
    if (payload.type !== expectedType) {
        throw new Error("Invalid token type.");
    }
    if (payload.exp <= now) {
        throw new Error("Token expired.");
    }
    return payload;
}
