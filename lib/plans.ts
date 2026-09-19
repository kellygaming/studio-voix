export type PlanId = "gratuit" | "standard" | "studio";

export type Plan = {
  id: PlanId;
  label: string;
  /** Durée max d'un enregistrement, en secondes. */
  maxRecordingSeconds: number;
  /** Minutes de traitement par mois (garde-fou facture Auphonic + transcription ElevenLabs). */
  monthlyMinutes: number;
  /** Niveau de débruitage Auphonic appliqué (cf. worker/src/plans.ts). */
  denoise: "dynamic" | "speech_isolation";
  /** Formulation affichable de ce niveau. */
  denoiseLabel: string;
};

// Plafonds à ajuster quand les prix de vente seront fixés.
export const PLANS: Record<PlanId, Plan> = {
  gratuit: {
    id: "gratuit", label: "Gratuit", maxRecordingSeconds: 3 * 60, monthlyMinutes: 3,
    denoise: "dynamic", denoiseLabel: "Bruits de fond, écho et respirations",
  },
  standard: {
    id: "standard", label: "Standard", maxRecordingSeconds: 30 * 60, monthlyMinutes: 120,
    denoise: "dynamic", denoiseLabel: "Bruits de fond, écho et respirations",
  },
  studio: {
    id: "studio", label: "Voix Studio", maxRecordingSeconds: 60 * 60, monthlyMinutes: 300,
    denoise: "speech_isolation", denoiseLabel: "Isolation de la voix : tout le reste est retiré",
  },
};

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "gratuit"] ?? PLANS.gratuit;
}
