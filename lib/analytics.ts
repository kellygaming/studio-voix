// Envoie un événement de conversion aux régies, si elles sont configurées.
// Sans identifiant (cf. components/Analytics.tsx), l'appel ne fait rien.
type Props = Record<string, string | number | boolean>;

type WithTrackers = typeof globalThis & {
  gtag?: (command: string, event: string, props?: Props) => void;
  fbq?: (command: string, event: string, props?: Props) => void;
};

/**
 * @param name  Événement GA4, en snake_case (ex. "essai_demarre").
 * @param meta  Événement Meta correspondant (ex. "Lead", "StartTrial"). Omis = non envoyé à Meta.
 */
export function track(name: string, meta?: string, props?: Props) {
  if (typeof window === "undefined") return;
  const w = window as WithTrackers;
  w.gtag?.("event", name, props);
  if (meta) w.fbq?.("track", meta, props);
}
