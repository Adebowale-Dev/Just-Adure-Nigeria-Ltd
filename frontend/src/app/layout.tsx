import "../globals.css";
import { DM_Serif_Display, Manrope, Marcellus } from "next/font/google";
import { Providers } from "@/components/layout/providers";

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marcellus",
  display: "swap",
});

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Just Adure Nigeria Ltd";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${storeName} | UK-used products in Nigeria`,
    template: `%s | ${storeName}`,
  },
  description: "Shop tested UK-used products in Nigerian naira with honest condition notes, secure checkout and delivery tracking.",
  openGraph: {
    title: storeName,
    description: "Tested UK-used products with clear condition grades and Nigerian delivery.",
    url: siteUrl,
    siteName: storeName,
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-NG" suppressHydrationWarning>
      <body className={`${dmSerifDisplay.variable} ${manrope.variable} ${marcellus.variable}`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

