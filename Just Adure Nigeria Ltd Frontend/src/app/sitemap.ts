import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return ["", "/shop", "/about", "/contact", "/faq", "/delivery-returns", "/privacy", "/terms"].map(
    (path) => ({ url: `${siteUrl}${path}`, lastModified: new Date() }),
  );
}
