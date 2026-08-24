import { Router } from "express";
import { getStoreSettings, serializeStoreSettings } from "../services/store-settings.js";

export const storeSettingsRouter = Router();

/**
 * @openapi
 * /api/v1/store-settings:
 *   get:
 *     tags: [Store]
 *     summary: Get public store settings
 *     responses:
 *       200:
 *         description: Store settings returned
 */
storeSettingsRouter.get("/store-settings", async (_request, response, next) => {
  try {
    const settings = await getStoreSettings();
    const publicSettings = serializeStoreSettings(settings);
    delete publicSettings.maintenanceMode;
    response.json({ data: { settings: publicSettings } });
  } catch (error) {
    next(error);
  }
});