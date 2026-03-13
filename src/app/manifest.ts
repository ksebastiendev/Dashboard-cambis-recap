import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cambis Recap",
    short_name: "Cambis Recap",
    description: "Dashboard de suivi d'activité pour cambiste",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1d4ed8",
    lang: "fr",
    icons: [],
  };
}
