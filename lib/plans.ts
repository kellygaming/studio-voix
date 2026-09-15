export type PlanId = "gratuit" | "standard" | "studio";

export type Plan = {
  id: PlanId;
  label: string;
  /** Durée max d'un enregistrement, en secondes. */
  maxRecordingSeconds: number;
  /** Minutes de traitement par mois (garde-fou facture ElevenLabs / Auphonic). */
  monthlyMinutes: number;
  denoiser: "auphonic" | "elevenlabs";
};

// Plafonds à ajuster quand les prix de vente seront fixés.
export const PLANS: Record<PlanId, Plan> = {
  gratuit: { id: "gratuit", label: "Gratuit", maxRecordingSeconds: 3 * 60, monthlyMinutes: 3, denoiser: "auphonic" },
  standard: { id: "standard", label: "Standard", maxRecordingSeconds: 30 * 60, monthlyMinutes: 120, denoiser: "auphonic" },
  studio: { id: "studio", label: "Voix Studio", maxRecordingSeconds: 60 * 60, monthlyMinutes: 300, denoiser: "elevenlabs" },
};

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "gratuit"] ?? PLANS.gratuit;
}
