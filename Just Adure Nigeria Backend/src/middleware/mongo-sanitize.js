import { AppError } from "../errors/app-error.js";

function sanitizeValue(value, path = "request") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => sanitizeValue(item, `${path}[${index}]`));
    return value;
  }

  if (!value || typeof value !== "object") return value;

  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      throw new AppError(400, "INVALID_REQUEST_INPUT", `Invalid field name in ${path}.`);
    }
    sanitizeValue(value[key], `${path}.${key}`);
  }

  return value;
}

export function sanitizeMongoInput(request, _response, next) {
  try {
    sanitizeValue(request.body, "body");
    sanitizeValue(request.query, "query");
    sanitizeValue(request.params, "params");
    next();
  } catch (error) {
    next(error);
  }
}