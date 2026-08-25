import { createHash } from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 5 * 1024 * 1024;

function isPlaceholderConfig() {
  return [env.CLOUDINARY_CLOUD_NAME, env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET].some((value) => value.includes("placeholder"));
}

function parseDataUri(dataUri) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUri);
  if (!match) throw new AppError(400, "INVALID_IMAGE", "Upload a valid JPEG, PNG or WebP image.");
  const [, mimeType, base64] = match;
  if (!allowedMimeTypes.has(mimeType)) throw new AppError(400, "INVALID_IMAGE_TYPE", "Only JPEG, PNG and WebP images are allowed.");
  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > maxImageBytes) throw new AppError(400, "INVALID_IMAGE_SIZE", "Product images must be between 1 byte and 5MB.");
  return { mimeType, buffer };
}

function signCloudinaryParams(params) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${payload}${env.CLOUDINARY_API_SECRET}`).digest("hex");
}

export async function uploadProductImage({ dataUri, altText, folder = "just-adure/products" }) {
  const { mimeType, buffer } = parseDataUri(dataUri);
  const safeAltText = altText.trim();
  if (safeAltText.length < 2) throw new AppError(400, "ALT_TEXT_REQUIRED", "Product image alt text is required.");

  if (env.NODE_ENV === "test" || isPlaceholderConfig()) {
    const digest = createHash("sha1").update(buffer).digest("hex").slice(0, 12);
    return {
      cloudinaryPublicId: `${folder}/demo-${digest}`,
      secureUrl: `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/demo-${digest}.jpg`,
      width: 1200,
      height: 900,
      altText: safeAltText,
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  const form = new FormData();
  form.set("file", new Blob([buffer], { type: mimeType }), "product-image");
  form.set("api_key", env.CLOUDINARY_API_KEY);
  form.set("timestamp", String(timestamp));
  form.set("folder", folder);
  form.set("signature", signCloudinaryParams(params));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new AppError(502, "CLOUDINARY_UPLOAD_FAILED", payload.error?.message ?? "Cloudinary image upload failed.");

  return {
    cloudinaryPublicId: payload.public_id,
    secureUrl: payload.secure_url,
    width: payload.width,
    height: payload.height,
    altText: safeAltText,
  };
}
