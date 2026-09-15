import { readFile, writeFile } from "node:fs/promises";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fileBlob(path: string, type: string) {
  return new Blob([new Uint8Array(await readFile(path))], { type });
}

/**
 * Offre Voix Studio : ElevenLabs Voice Isolator.
 * Entrée : fichier audio ; sortie écrite dans `output` (format renvoyé par l'API, à reconvertir en WAV).
 */
export async function isolateWithElevenLabs(input: string, output: string) {
  const form = new FormData();
  form.append("audio", await fileBlob(input, "audio/flac"), "input.flac");
  const res = await fetch("https://api.elevenlabs.io/v1/audio-isolation", {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" },
    body: form,
  });
  if (!res.ok) throw new Error(`ElevenLabs Voice Isolator : ${res.status} ${await res.text()}`);
  await writeFile(output, Buffer.from(await res.arrayBuffer()));
}

/**
 * Offre Standard : Auphonic (débruitage uniquement ; le niveau final est géré à l'export).
 * Flux : créer la production → envoyer le fichier → démarrer → attendre → télécharger.
 */
export async function denoiseWithAuphonic(input: string, output: string, title: string, onProgress?: (p: number) => void) {
  const base = "https://auphonic.com/api";
  const headers = { Authorization: `Bearer ${process.env.AUPHONIC_API_TOKEN ?? ""}` };

  const createRes = await fetch(`${base}/productions.json`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      metadata: { title },
      output_files: [{ format: "wav", ending: "wav" }],
      algorithms: { denoise: true, denoiseamount: 0, hipfilter: true, leveler: false, normloudness: false },
    }),
  });
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
