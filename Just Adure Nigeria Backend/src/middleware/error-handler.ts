import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new AppError(404, "ROUTE_NOT_FOUND", "The requested route was not found."));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const requestId = String(response.locals.requestId ?? "unknown");

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
        fields: error.flatten().fieldErrors,
      },
      requestId,
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
      requestId,
    });
    return;
  }

  request.log?.error({ error, requestId }, "Unhandled request error");
  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
      ...(env.NODE_ENV === "development" && error instanceof Error
        ? { developmentMessage: error.message }
        : {}),
    },
    requestId,
  });
};
