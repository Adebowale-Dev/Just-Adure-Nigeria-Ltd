import { Router } from "express";
import { getPublicHomepage } from "../services/homepage-content.js";

export const homepageRouter = Router();

/**
 * @openapi
 * /api/v1/homepage:
 *   get:
 *     tags: [Storefront]
 *     summary: Get public homepage content and featured products
 *     responses:
 *       200:
 *         description: Homepage content returned
 */
homepageRouter.get("/homepage", async (_request, response, next) => {
  try {
    response.json({ data: await getPublicHomepage() });
  } catch (error) {
    next(error);
  }
});