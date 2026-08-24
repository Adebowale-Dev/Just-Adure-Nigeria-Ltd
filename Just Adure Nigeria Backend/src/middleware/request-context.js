import { randomUUID } from "node:crypto";
export const requestContext = (request, response, next) => {
    const incomingId = request.header("x-request-id");
    const requestId = incomingId?.slice(0, 128) || randomUUID();
    response.locals.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    next();
};
