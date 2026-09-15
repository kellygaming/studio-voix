import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { buildFfmpegFilter, keptSegments, type Cut } from "./cuts.js";
import { denoiseWithAuphonic, isolateWithElevenLabs } from "./denoise.js";
import { computePeaks, probeDuration, run, toFlac, toPreviewMp3, toWav } from "./ffmpeg.js";
import { limitsFor } from "./plans.js";
import { transcribe } from "./transcribe.js";

const BUCKET = "audio";
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 3000);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 2);

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

type Job = { id: string; project_id: string; user_id: string; type: "process" | "export"; attempts: number };

async function updateJob(id: string, patch: Record<string, unknown>) {
  await supabase.from("jobs").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
}

async function download(path: string, dest: string) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Téléchargement impossible (${path}) : ${error?.message}`);
  await writeFile(dest, Buffer.from(await data.arrayBuffer()));
}

async function upload(path: string, file: string, contentType: string) {
  const body = await readFile(file);
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(`Envoi impossible (${path}) : ${error.message}`);
}

// ---------------- Traitement : débruitage → transcription ----------------
async function processJob(job: Job, dir: string) {
  const step = (name: string, progress: number) => updateJob(job.id, { step: name, progress });

  const { data: project, error } = await supabase.from("projects").select("*").eq("id", job.project_id).single();
  if (error || !project?.raw_path) throw new Error("Projet ou enregistrement introuvable");
  const { data: profile } = await supabase.from("profiles").select("plan, plan_expires_at").eq("id", job.user_id).single();
  const limits = limitsFor(profile?.plan, profile?.plan_expires_at);

  await step("download", 0.05);
  const raw = join(dir, "raw");
  await download(project.raw_path, raw);
  const rawWav = join(dir, "raw.wav");
  await toWav(raw, rawWav);

  // Garde-fou : durée réelle mesurée côté serveur (le client pourrait mentir)
  const duration = await probeDuration(rawWav);
  if (duration > limits.maxRecordingSeconds + 5) {
    throw new Error(`Enregistrement trop long pour votre offre (${Math.round(duration)} s > ${limits.maxRecordingSeconds} s)`);
  }
  await updateJob(job.id, { billed_seconds: duration });

  await step("denoise", 0.15);
  const rawFlac = join(dir, "raw.flac");
  await toFlac(rawWav, rawFlac);
  const denoised = join(dir, "denoised");
  if (limits.denoiser === "elevenlabs") {
    await isolateWithElevenLabs(rawFlac, denoised);
  } else {
    await denoiseWithAuphonic(rawFlac, denoised, `${project.id}`, (p) => void step("denoise", 0.15 + p * 0.4));
  }
  const cleanWav = join(dir, "clean.wav");
  await toWav(denoised, cleanWav);

  await step("transcribe", 0.6);
  const cleanFlac = join(dir, "clean.flac");
  await toFlac(cleanWav, cleanFlac);
  const words = await transcribe(cleanFlac);

  await step("finalize", 0.85);
  const previewMp3 = join(dir, "preview.mp3");
  await toPreviewMp3(cleanWav, previewMp3);
  const peaks = await computePeaks(cleanWav);
  const cleanDuration = await probeDuration(cleanWav);

  const prefix = `${job.user_id}/${job.project_id}`;
  await upload(`${prefix}/clean.wav`, cleanWav, "audio/wav");
  await upload(`${prefix}/preview.mp3`, previewMp3, "audio/mpeg");

  // Transcription neuve = anciennes coupes invalides
  await supabase.from("cuts").delete().eq("project_id", job.project_id);

  const { error: updErr } = await supabase
    .from("projects")
    .update({
      clean_path: `${prefix}/clean.wav`,
      preview_path: `${prefix}/preview.mp3`,
      peaks,
      words,
      duration_seconds: cleanDuration,
      status: "ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.project_id);
  if (updErr) throw new Error(updErr.message);
}

// ---------------- Export : coupes + fondus + -16 LUFS ----------------
async function exportJob(job: Job, dir: string) {
  const step = (name: string, progress: number) => updateJob(job.id, { step: name, progress });

  const { data: project } = await supabase.from("projects").select("clean_path, duration_seconds").eq("id", job.project_id).single();
  if (!project?.clean_path) throw new Error("Audio nettoyé introuvable");
  const { data: rows } = await supabase.from("cuts").select("id, start_s, end_s, kind").eq("project_id", job.project_id);

  await step("export", 0.1);
  const clean = join(dir, "clean.wav");
  await download(project.clean_path, clean);
  const duration = await probeDuration(clean);

  const cuts: Cut[] = (rows ?? []).map((r) => ({ id: r.id, start: r.start_s, end: r.end_s, kind: r.kind }));
  const segments = keptSegments(cuts, duration);
  const filterFile = join(dir, "filter.txt");
  await writeFile(filterFile, buildFfmpegFilter(segments));

  await step("export", 0.3);
  const out = join(dir, "export.mp3");
  await run("ffmpeg", [
    "-y",
    "-i", clean,
    "-filter_complex_script", filterFile,
    "-map", "[out]",
    "-ac", "1",
    "-ar", "44100",
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    out,
  ]);

  await step("export", 0.85);
  // Chemin unique par export : évite qu'un cache serve une ancienne version
  const path = `${job.user_id}/${job.project_id}/export-${job.id}.mp3`;
  await upload(path, out, "audio/mpeg");
  await supabase.from("projects").update({ export_path: path, updated_at: new Date().toISOString() }).eq("id", job.project_id);
}

// ---------------- Boucle ----------------
async function handle(job: Job) {
  const dir = await mkdtemp(join(tmpdir(), `sv-${job.id}-`));
  console.log(`[job ${job.id}] ${job.type} (tentative ${job.attempts})`);
  try {
    if (job.type === "process") await processJob(job, dir);
    else await exportJob(job, dir);
    await updateJob(job.id, { status: "done", progress: 1, error: null });
    console.log(`[job ${job.id}] terminé`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[job ${job.id}] erreur :`, message);
    await updateJob(job.id, { status: "error", error: message.slice(0, 500) });
    if (job.type === "process") {
      await supabase.from("projects").update({ status: "error" }).eq("id", job.project_id);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

let active = 0;
let stopping = false;

async function tick() {
  while (!stopping && active < CONCURRENCY) {
    const { data, error } = await supabase.rpc("claim_job");
    if (error) {
      console.error("claim_job :", error.message);
      break;
    }
    const job = data as Job | null;
    if (!job || !job.id) break;
    active++;
    void handle(job).finally(() => active--);
  }
}

setInterval(() => void tick(), POLL_INTERVAL_MS);
void tick();
console.log(`Worker Studio Voix démarré (concurrence ${CONCURRENCY})`);

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => {
    stopping = true;
    console.log("Arrêt demandé : fin des jobs en cours…");
    const wait = setInterval(() => {
      if (active === 0) {
        clearInterval(wait);
        process.exit(0);
      }
    }, 500);
  });
}
