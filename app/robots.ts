import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // L'espace de travail est derrière l'authentification : inutile de le faire explorer.
      { userAgent: "*", allow: "/", disallow: ["/enregistrer", "/projets", "/connexion", "/auth/", "/api/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
