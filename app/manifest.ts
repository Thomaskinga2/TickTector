import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TikTector",
    short_name: "TikTector",
    description: "Weekly tick risk for Massachusetts towns.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7f3",
    theme_color: "#1f3a2e",
    // TODO: replace placeholder icons with real artwork.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
