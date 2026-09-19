import { readFile, writeFile } from "node:fs/promises";
import type { DenoiseProfile } from "./plans.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Lit une clé d'environnement en retirant espaces, retours à la ligne et guillemets collés par erreur. */
function secret(name: string): string {
  return (process.env[name] ?? "").trim().replace(/^["']|["']$/g, "");
}

async function fileBlob(path: string, type: string) {
  return new Blob([new Uint8Array(await readFile(path))], { type });
}

// Doit rester aligné sur le loudnorm appliqué à l'export (worker/src/cuts.ts) : sans quoi
// l'aperçu entendu dans l'éditeur n'a pas le niveau du MP3 final.
const LOUDNESS_TARGET_LUFS = -16;
const MAX_PEAK_DBTP = -1.5;

/**
 * Débruitage Auphonic (toutes les offres ; le niveau du fichier final est refait à l'export).
 * Flux : créer la production → envoyer le fichier → démarrer → attendre → télécharger.
 */
export async function denoiseWithAuphonic(
  input: string,
  output: string,
  title: string,
  profile: DenoiseProfile,
  onProgress?: (p: number) => void,
) {
  const base = "https://auphonic.com/api";
  const token = secret("AUPHONIC_API_TOKEN");
  if (!token) throw new Error("Auphonic : AUPHONIC_API_TOKEN manquant sur le worker");
  const headers = { Authorization: `Bearer ${token}` };

  const createRes = await fetch(`${base}/productions.json`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      metadata: { title },
      output_files: [{ format: "wav", ending: "wav" }],
      algorithms: {
        denoise: true,
        denoisemethod: profile.method,
        denoiseamount: profile.denoiseAmount,
        dereverbamount: profile.dereverbAmount,
        debreath: profile.debreath,
        debreathamount: profile.debreath ? 0 : -1,
        hipfilter: true,
        // Le leveler corrige les écarts de volume à l'intérieur du fichier (locuteur qui
        // s'éloigne du micro) ; loudnorm à l'export ne règle que le niveau global.
        leveler: true,
        normloudness: true,
        loudnesstarget: LOUDNESS_TARGET_LUFS,
        maxpeak: MAX_PEAK_DBTP,
      },
    }),
  });
  if (createRes.status === 401 || createRes.status === 403) {
    throw new Error(`Auphonic : clé API refusée (${createRes.status}). Vérifiez AUPHONIC_API_TOKEN (Auphonic → Account Settings → API Key).`);
  }
  if (createRes.status === 402) {
    throw new Error("Auphonic : crédits épuisés. Rechargez l'abonnement (Auphonic → Credits) avant de relancer le traitement.");
  }
  if (!createRes.ok) throw new Error(`Auphonic (création) : ${createRes.status} ${await createRes.text()}`);
  const uuid = ((await createRes.json()) as { data: { uuid: string } }).data.uuid;

  const form = new FormData();
  form.append("input_file", await fileBlob(input, "audio/flac"), "input.flac");
  const upRes = await fetch(`${base}/production/${uuid}/upload.json`, { method: "POST", headers, body: form });
  if (!upRes.ok) throw new Error(`Auphonic (envoi) : ${upRes.status} ${await upRes.text()}`);

  const startRes = await fetch(`${base}/production/${uuid}/start.json`, { method: "POST", headers });
  if (!startRes.ok) throw new Error(`Auphonic (démarrage) : ${startRes.status} ${await startRes.text()}`);

  // Statuts Auphonic : 3 = terminé, 2 = erreur
  const deadline = Date.now() + 45 * 60_000;
  while (Date.now() < deadline) {
    await sleep(5000);
    const st = await fetch(`${base}/production/${uuid}.json`, { headers });
    if (!st.ok) continue;
    const { data } = (await st.json()) as {
      data: { status: number; status_string: string; error_message?: string; output_files?: { download_url: string }[]; progress?: number };
    };
    if (typeof data.progress === "number") onProgress?.(data.progress / 100);
    if (data.status === 2) throw new Error(`Auphonic : ${data.error_message || data.status_string}`);
    if (data.status === 3) {
      const url = data.output_files?.[0]?.download_url;
      if (!url) throw new Error("Auphonic : aucun fichier de sortie");
      const dl = await fetch(url, { headers });
      if (!dl.ok) throw new Error(`Auphonic (téléchargement) : ${dl.status}`);
      await writeFile(output, Buffer.from(await dl.arrayBuffer()));
      // Nettoyage côté Auphonic (non bloquant)
      fetch(`${base}/production/${uuid}.json`, { method: "DELETE", headers }).catch(() => {});
      return;
    }
  }
  throw new Error("Auphonic : délai dépassé");
}
