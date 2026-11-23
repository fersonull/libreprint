import type { MetadataRoute } from "next";

// Lets phones install the site; iPhones only allow push notifications for installed web apps.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "libreprint",
    short_name: "libreprint",
    description: "Send documents to the print shop counter and track them live.",
    start_url: "/upload",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#18181b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
