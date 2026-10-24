import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TickTector",
    short_name: "TickTector",
    description: "Weekly tick risk for Massachusetts towns.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe4",
    theme_color: "#2f7a41",
    // Tick on hemlock green, made by scripts/make-icons.mjs.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
