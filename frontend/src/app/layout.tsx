import "../globals.css";
import { Marcellus, Noto_Serif, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/layout/providers";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
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
      <body className={`${notoSerif.variable} ${sourceSans.variable} ${marcellus.variable}`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

