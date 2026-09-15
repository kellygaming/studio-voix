import { readFile } from "node:fs/promises";
import type { Word } from "./cuts.js";

type ScribeWord = { text: string; start: number; end: number; type: "word" | "spacing" | "audio_event" };

/** Passe batch ElevenLabs Scribe v2 sur l'audio nettoyé, avec minutage par mot. */
export async function transcribe(file: string): Promise<Word[]> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(await readFile(file))], { type: "audio/flac" }), "clean.flac");
  form.append("model_id", "scribe_v2");
  form.append("language_code", "fr");
  form.append("timestamps_granularity", "word");
  form.append("tag_audio_events", "false");
  form.append("diarize", "false");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" },
    body: form,
  });
  if (!res.ok) throw new Error(`ElevenLabs Scribe : ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { words?: ScribeWord[] };

  return (body.words ?? [])
    .filter((w) => w.type === "word" && w.text.trim())
    .map((w) => ({ text: w.text.trim(), start: round(w.start), end: round(w.end) }));
}

const round = (n: number) => Math.round(n * 1000) / 1000;
