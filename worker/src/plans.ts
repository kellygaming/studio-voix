// Garder synchronisé avec lib/plans.ts et plan_limits() dans la migration SQL.
export const PLAN_LIMITS: Record<string, { maxRecordingSeconds: number; denoiser: "auphonic" | "elevenlabs" }> = {
  gratuit: { maxRecordingSeconds: 180, denoiser: "auphonic" },
  standard: { maxRecordingSeconds: 1800, denoiser: "auphonic" },
  studio: { maxRecordingSeconds: 3600, denoiser: "elevenlabs" },
};

export function limitsFor(plan: string | null | undefined, expiresAt: string | null | undefined) {
  const expired = expiresAt && new Date(expiresAt) < new Date();
  return PLAN_LIMITS[expired ? "gratuit" : plan ?? "gratuit"] ?? PLAN_LIMITS.gratuit;
}
