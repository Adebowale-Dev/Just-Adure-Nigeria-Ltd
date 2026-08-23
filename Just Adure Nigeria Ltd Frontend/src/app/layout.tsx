import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Just Adure Nigeria Ltd";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${storeName} | Tested UK-Used Tech in Nigeria`,
    template: `%s | ${storeName}`,
  },
  description:
    "Shop carefully tested UK-used phones, laptops, televisions, consoles, appliances, and accessories in Nigeria.",
  applicationName: storeName,
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: storeName,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: siteUrl,
    email: process.env.NEXT_PUBLIC_STORE_EMAIL || "hello@example.com",
  };

  return (
    <html lang="en-NG">
      <body>
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
      </body>
    </html>
  );
}
