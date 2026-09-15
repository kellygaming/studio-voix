import { spawn } from "node:child_process";

export function run(cmd: string, args: string[], opts: { collectStdout?: boolean } = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    const out: Buffer[] = [];
    let err = "";
    p.stdout.on("data", (d: Buffer) => {
      if (opts.collectStdout) out.push(d);
    });
    p.stderr.on("data", (d: Buffer) => {
      err += d.toString();
      if (err.length > 20_000) err = err.slice(-10_000);
    });
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`${cmd} a échoué (${code}) : ${err.slice(-1500)}`))));
  });
}

/** Décode n'importe quel format en WAV 48 kHz mono 16 bits. */
export function toWav(input: string, output: string) {
  return run("ffmpeg", ["-y", "-i", input, "-vn", "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", output]);
}

export function toFlac(input: string, output: string) {
  return run("ffmpeg", ["-y", "-i", input, "-ac", "1", "-c:a", "flac", output]);
}

/** MP3 léger pour l'écoute dans l'éditeur (CBR pour un positionnement fiable). */
export function toPreviewMp3(input: string, output: string) {
  return run("ffmpeg", ["-y", "-i", input, "-ac", "1", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "96k", output]);
}

export async function probeDuration(file: string): Promise<number> {
  const out = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file], { collectStdout: true });
  const d = parseFloat(out.toString().trim());
  if (!Number.isFinite(d)) throw new Error("Durée audio introuvable");
  return d;
}

/** Forme d'onde : `buckets` valeurs de crête normalisées 0..1. */
export async function computePeaks(file: string, buckets = 2000): Promise<number[]> {
  const pcm = await run("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", "4000", "-f", "s16le", "-"], { collectStdout: true });
  const samples = Math.floor(pcm.length / 2);
  if (!samples) return [];
  const size = Math.max(1, Math.floor(samples / buckets));
  const peaks: number[] = [];
  let max = 0;
  for (let b = 0; b * size < samples; b++) {
    let peak = 0;
    const end = Math.min(samples, (b + 1) * size);
    for (let i = b * size; i < end; i++) peak = Math.max(peak, Math.abs(pcm.readInt16LE(i * 2)));
    peaks.push(peak);
    max = Math.max(max, peak);
  }
  return peaks.map((p) => Math.round((p / (max || 1)) * 1000) / 1000);
}
