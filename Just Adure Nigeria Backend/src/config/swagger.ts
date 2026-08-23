import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

export const openApiDocument = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Just Adure Nigeria Ltd API",
      version: "0.1.0",
      description:
        "REST API for the placeholder-branded UK-used products marketplace.",
    },
    servers: [{ url: env.API_URL, description: env.NODE_ENV }],
    tags: [
      { name: "System", description: "Service health and readiness" },
      { name: "Payments", description: "Paystack integration endpoints" },
    ],
    components: {
      schemas: {
        ApiError: {
          type: "object",
          required: ["error", "requestId"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                fields: { type: "object", additionalProperties: true },
              },
            },
            requestId: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/**/*.ts"],
});
