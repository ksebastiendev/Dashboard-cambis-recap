import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chapkey Recap",
    short_name: "Chapkey",
    description: "Dashboard de suivi d'activité Chapkey",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#FE5301",
    lang: "fr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
