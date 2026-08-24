import { StoreSettings } from "../models/store-settings.js";

export function serializeStoreSettings(settings) {
  return {
    id: String(settings._id),
    storeName: settings.storeName,
    logoUrl: settings.logoUrl ?? "",
    contactEmail: settings.contactEmail,
    phoneNumber: settings.phoneNumber,
    whatsappNumber: settings.whatsappNumber,
    storeAddress: settings.storeAddress,
    socialLinks: settings.socialLinks ?? {},
    defaultCurrency: settings.defaultCurrency,
    taxRatePercent: settings.taxRatePercent,
    defaultDeliveryInformation: settings.defaultDeliveryInformation,
    returnPeriodDays: settings.returnPeriodDays,
    warrantyInformation: settings.warrantyInformation,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage ?? "",
    updatedAt: settings.updatedAt,
  };
}

export async function getStoreSettings() {
  const settings = await StoreSettings.findOneAndUpdate(
    { singletonKey: "store-settings" },
    { $setOnInsert: { singletonKey: "store-settings" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  return settings;
}