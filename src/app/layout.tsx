import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dukafiy.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dukafiy - Premium Shopping Experience in Kenya",
    template: "%s | Dukafiy",
  },
  description:
    "Shop premium quality products at Dukafiy. Your go-to platform for an unmatched shopping experience in Kenya. We sell lifestyle, not just products. Fast delivery, secure payments with M-Pesa.",
  keywords: [
    "Dukafiy",
    "shopping",
    "Kenya",
    "premium products",
    "online store",
    "ecommerce",
    "beauty products",
    "skincare",
    "cosmetics",
    "Nairobi",
    "M-Pesa",
  ],
  authors: [{ name: "Dukafiy" }],
  creator: "Dukafiy",
  publisher: "Dukafiy",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: siteUrl,
    siteName: "Dukafiy",
    title: "Dukafiy - Premium Shopping Experience in Kenya",
    description:
      "Shop premium quality products at Dukafiy. Your go-to platform for an unmatched shopping experience in Kenya.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dukafiy - Premium Shopping Experience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@dukafiy",
    creator: "@dukafiy",
    title: "Dukafiy - Premium Shopping Experience in Kenya",
    description:
      "Shop premium quality products at Dukafiy. Your go-to platform for an unmatched shopping experience in Kenya.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  other: {
    "geo.region": "KE",
    "geo.placename": "Nairobi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
