import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SJQD Software",
    short_name: "SJQD",
    description:
      "SJQD Software is a billing, GST, barcode, stock and business management platform.",
    id: "/login",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf4cf",
    theme_color: "#d4af37",
    icons: [
      {
        src: "/logo.png",
        sizes: "538x543",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
