import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#d4af37",
};

export const metadata: Metadata = {
  title: {
    default: "SJQD Software",
    template: "%s | SJQD Software",
  },
  applicationName: "SJQD Software",
  description:
    "SJQD Software is a billing, barcode, GST, stock and business management platform for sales, purchase and account workflows.",
  keywords: [
    "SJQD",
    "SJQD Software",
    "billing software",
    "GST billing software",
    "barcode billing",
    "inventory software",
    "business management software",
  ],
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SJQD Software",
  },
  openGraph: {
    title: "SJQD Software",
    description:
      "SJQD Software helps businesses handle billing, GST, barcode workflows, stock, cash, bank, receivables and purchase records from one place.",
    siteName: "SJQD Software",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SJQD Software",
    description:
      "Professional SJQD billing software for GST, stock, barcode, invoicing and business control.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
