// Garder synchronisé avec lib/plans.ts et plan_limits() dans la migration SQL.

/**
 * Réglages du débruitage Auphonic, par offre.
 *
 * `method` correspond au paramètre `denoisemethod` de l'API Auphonic :
 *   - "dynamic"          : ne garde que la voix et la musique.
 *   - "speech_isolation" : ne garde que la parole, supprime même la musique de fond.
 * Auphonic accepte aussi "classic" (sa méthode historique, la plus douce) et "static".
 * C'est "classic" qui s'appliquait ici tant que le paramètre n'était pas envoyé, ce qui
 * expliquait un débruitage très timide.
 *
 * Les montants sont en dB : 0 = automatique (maximum), -1 = désactivé.
 * La réduction des respirations exige "dynamic" ou "speech_isolation".
 */
export type DenoiseProfile = {
  method: "dynamic" | "speech_isolation";
  denoiseAmount: number;
  dereverbAmount: number;
  debreath: boolean;
};

export const PLAN_LIMITS: Record<string, { maxRecordingSeconds: number; denoise: DenoiseProfile }> = {
  // L'offre gratuite applique le meme traitement que Standard : c'est la vitrine du produit,
  // et la page d'accueil promet la reduction des respirations sans distinguer les offres.
  // Ce qui differe entre Gratuit et Standard, c'est la duree et le quota, pas la qualite.
  gratuit: {
    maxRecordingSeconds: 180,
    denoise: { method: "dynamic", denoiseAmount: 0, dereverbAmount: 0, debreath: true },
  },
  standard: {
    maxRecordingSeconds: 1800,
    denoise: { method: "dynamic", denoiseAmount: 0, dereverbAmount: 0, debreath: true },
  },
  studio: {
    maxRecordingSeconds: 3600,
    denoise: { method: "speech_isolation", denoiseAmount: 0, dereverbAmount: 0, debreath: true },
  },
};

export function limitsFor(plan: string | null | undefined, expiresAt: string | null | undefined) {
  const expired = expiresAt && new Date(expiresAt) < new Date();
  return PLAN_LIMITS[expired ? "gratuit" : plan ?? "gratuit"] ?? PLAN_LIMITS.gratuit;
}
