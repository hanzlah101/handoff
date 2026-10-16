import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f9fafb",
    description: "Browser automations that know when to ask a human.",
    display: "standalone",
    icons: [
      { sizes: "192x192", src: "/icon-192.png", type: "image/png" },
      { sizes: "512x512", src: "/icon-512.png", type: "image/png" },
    ],
    name: "Handoff",
    short_name: "Handoff",
    start_url: "/",
    theme_color: "#1e59cd",
  };
}
