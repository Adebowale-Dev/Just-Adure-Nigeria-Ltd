import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
const keyLength = 64;
export async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, keyLength));
    return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}
export async function verifyPassword(password, storedHash) {
    const [algorithm, salt, hash] = storedHash.split(":");
    if (algorithm !== "scrypt" || !salt || !hash) {
        return false;
    }
    const storedKey = Buffer.from(hash, "hex");
    const derivedKey = (await scrypt(password, salt, storedKey.length));
    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}
