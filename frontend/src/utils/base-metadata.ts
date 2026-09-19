import type { Metadata } from "next";

import { cash } from "./images";

export const baseMetadata = (locale: string, overrideAttr?: Metadata) => ({
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: "Zatca Gateway",
  description: "Zatca Gateway",
  keywords: ["Zatca Gateway"],
  authors: [{ name: "Zatca Gateway Team" }],
  openGraph: {
    type: "website",
    locale: locale,
    alternateLocale: locale === "en" ? "ar" : "en",
    siteName: "Zatca Gateway",
    images: [
      {
        url: cash.src,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Zatca Gateway",
    description: "Zatca Gateway",
    images: [cash.src],
  },
  alternates: {
    canonical: `/${locale}`,
    languages: {
      en: "/en",
      ar: "/ar",
    },
  },
  robots: {
    index: false,
    follow: false,
  },
  ...overrideAttr,
});
