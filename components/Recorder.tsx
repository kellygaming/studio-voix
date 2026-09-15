"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { startLiveTranscription } from "@/lib/liveTranscription";
import { AUDIO_BUCKET } from "@/lib/types";

type Props = {
  userId: string;
  planLabel: string;
  maxSeconds: number;
  template: string;
};

type Phase = "idle" | "starting" | "recording" | "saving" | "error";

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4;codecs=mp4a.40.2", "audio/mp4"];

export function Recorder({ userId, planLabel, maxSeconds, template }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [committed, setCommitted] = useState<string[]>([]);
  const [partial, setPartial] = useState("");
  const [liveStatus, setLiveStatus] = useState<"off" | "on" | "indispo">("off");
  const [title, setTitle] = useState(defaultTitle(template));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopLiveRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number>(0);
  const startedAtRef = useRef(0);
  const committedRef = useRef<string[]>([]);
  const partialRef = useRef("");

  useEffect(() => () => cleanup(), []);

  // Arrêt automatique au plafond de l'offre
  useEffect(() => {
    if (phase === "recording" && elapsed >= maxSeconds) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, phase, maxSeconds]);

  function cleanup() {
    cancelAnimationFrame(rafRef.current);
    stopLiveRef.current?.();
    stopLiveRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }

  async function start() {
    setError("");
    setPhase("starting");
    try {
      // Filtres navigateur désactivés : ils dégradent la voix, le débruitage est fait côté serveur.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: false,
          echoCancellation: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;

      const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128_000 });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => void save(rec.mimeType || mimeType || "audio/webm");
      recorderRef.current = rec;

      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const data = new Float32Array(analyser.fftSize);

      rec.start(1000);
      startedAtRef.current = performance.now();
      setElapsed(0);
      setPhase("recording");

      const tick = () => {
        analyser.getFloatTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
        setLevel(peak);
        setElapsed((performance.now() - startedAtRef.current) / 1000);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      committedRef.current = [];
      setCommitted([]);
      setPartial("");
      startLiveTranscription(ctx, source, {
        onPartial: (t) => {
          partialRef.current = t;
          setPartial(t);
        },
        onCommitted: (t) => {
          if (!t.trim()) return;
          committedRef.current = [...committedRef.current, t.trim()];
          setCommitted(committedRef.current);
          partialRef.current = "";
          setPartial("");
        },
        onError: () => setLiveStatus("indispo"),
      })
        .then((stopFn) => {
          stopLiveRef.current = stopFn;
          setLiveStatus("on");
        })
        .catch(() => setLiveStatus("indispo"));
    } catch (e) {
      cleanup();
      setPhase("error");
      setError(e instanceof DOMException && e.name === "NotAllowedError" ? "Autorisez l'accès au micro pour enregistrer." : "Impossible de démarrer l'enregistrement.");
    }
  }

  function stop() {
    if (recorderRef.current?.state === "recording") {
      setPhase("saving");
      recorderRef.current.stop();
    }
  }

  async function save(mimeType: string) {
    const duration = (performance.now() - startedAtRef.current) / 1000;
    cleanup();
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const live = [...committedRef.current, partialRef.current].filter(Boolean).join(" ");
    await uploadAndProcess(blob, Math.min(duration, maxSeconds), extensionFor(mimeType), live);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const duration = await probeDuration(file).catch(() => null);
    if (duration == null) {
      setError("Fichier audio illisible.");
      return;
    }
    if (duration > maxSeconds + 5) {
      setError(`Ce fichier dure ${formatTime(duration)} : l'offre ${planLabel} est limitée à ${formatTime(maxSeconds)}.`);
      return;
    }
    setPhase("saving");
    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "audio";
    await uploadAndProcess(file, duration, ext, null);
  }

  async function uploadAndProcess(blob: Blob, duration: number, ext: string, liveTranscript: string | null) {
    const supabase = createClient();
    try {
      const { data: project, error: insertErr } = await supabase
        .from("projects")
        .insert({ user_id: userId, title: title.trim() || "Sans titre", template, status: "recording" })
        .select("id")
        .single();
      if (insertErr || !project) throw insertErr ?? new Error("création du projet");

      const rawPath = `${userId}/${project.id}/raw.${ext}`;
      const { error: upErr } = await supabase.storage.from(AUDIO_BUCKET).upload(rawPath, blob, { contentType: blob.type || undefined, upsert: true });
      if (upErr) throw upErr;

      const { error: updErr } = await supabase
        .from("projects")
        .update({ raw_path: rawPath, duration_seconds: duration, live_transcript: liveTranscript, status: "uploaded" })
        .eq("id", project.id);
      if (updErr) throw updErr;

      const { error: jobErr } = await supabase.rpc("enqueue_job", { p_project: project.id, p_type: "process" });
      if (jobErr) throw jobErr;

      router.push(`/projets/${project.id}`);
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Échec de l'envoi. Réessayez.");
    }
  }

  const remaining = Math.max(0, maxSeconds - elapsed);
  const liveText = [...committed, partial].filter(Boolean).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} disabled={phase !== "idle" && phase !== "error"} aria-label="Titre du projet" />

      <div
        style={{
          borderRadius: 24,
          padding: "36px 20px",
          background: "var(--grad-bleu)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{formatTime(elapsed)}</div>
        <LevelMeter level={phase === "recording" ? level : 0} />

        {phase === "recording" ? (
          <button onClick={stop} className="btn" style={{ background: "#fff", color: "var(--encre)", width: 88, height: 88, borderRadius: "50%" }} aria-label="Arrêter">
            <span style={{ width: 28, height: 28, borderRadius: 6, background: "var(--rose)" }} />
          </button>
        ) : (
          <button
            onClick={start}
            disabled={phase === "starting" || phase === "saving"}
            className="btn"
            style={{ background: "#fff", width: 88, height: 88, borderRadius: "50%" }}
            aria-label="Enregistrer"
          >
            <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--rose)" }} />
          </button>
        )}

        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.95, textAlign: "center" }}>
          {phase === "idle" && `Offre ${planLabel} : jusqu'à ${formatTime(maxSeconds)} par enregistrement`}
          {phase === "starting" && "Accès au micro…"}
          {phase === "recording" && `Temps restant : ${formatTime(remaining)}`}
          {phase === "saving" && "Envoi de l'audio…"}
          {phase === "error" && "Réessayez"}
        </div>
      </div>

      {error && <p className="error" style={{ margin: 0 }}>{error}</p>}

      <div className="card" style={{ minHeight: 120 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong style={{ fontSize: 15 }}>Transcription en direct</strong>
          <span className="muted" style={{ fontSize: 12 }}>
            {liveStatus === "on" ? "● en direct" : liveStatus === "indispo" ? "indisponible — la transcription finale sera faite après" : ""}
          </span>
        </div>
        <p style={{ margin: 0, lineHeight: 1.6, color: "var(--texte)" }}>
          {liveText || <span className="muted">Le texte s&apos;écrira ici pendant que vous parlez.</span>}
        </p>
      </div>

      <label className="btn btn-blanc" style={{ alignSelf: "center" }}>
        Ou importer un fichier audio
        <input type="file" accept="audio/*" onChange={onFile} hidden disabled={phase === "recording" || phase === "saving"} />
      </label>
    </div>
  );
}

function LevelMeter({ level }: { level: number }) {
  const bars = 24;
  const db = level > 0 ? 20 * Math.log10(level) : -60;
  const lit = Math.round(Math.max(0, Math.min(1, (db + 60) / 60)) * bars);
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 36 }} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 8 + (i / bars) * 28,
            borderRadius: 3,
            background: i < lit ? (i > bars * 0.85 ? "var(--jaune)" : "#fff") : "rgba(255,255,255,0.3)",
          }}
        />
      ))}
    </div>
  );
}

export function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function extensionFor(mime: string) {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "m4a";
  return "audio";
}

function defaultTitle(template: string) {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const label = ({ podcast: "Podcast", cours: "Cours", note: "Note vocale" } as Record<string, string>)[template] ?? "Enregistrement";
  return `${label} du ${date}`;
}

function probeDuration(file: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (Number.isFinite(audio.duration)) resolve(audio.duration);
      else reject(new Error("durée inconnue"));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("illisible"));
    };
    audio.src = url;
  });
}
