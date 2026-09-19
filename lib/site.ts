// URL publique du site : sert de base aux balises Open Graph, au sitemap et au robots.txt.
// En production, définir NEXT_PUBLIC_SITE_URL sur le vrai domaine (pas l'URL *.vercel.app).
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  // Repli automatique sur le domaine de production Vercel tant que le domaine n'est pas branché.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SITE = {
  name: "Studio Voix",
  title: "Studio Voix — une voix de studio, sans micro pro",
  description:
    "Enregistrez depuis votre navigateur, nettoyez le bruit de fond, éditez votre audio comme un texte et exportez un MP3 prêt à partager. Rien à installer, en français.",
} as const;
