"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { finalDuration, groupSentences, mergeCuts, silenceCuts, skipTarget, transcriptToTxt, type Cut } from "@/lib/cuts";
import { AUDIO_BUCKET, type Job, type Project } from "@/lib/types";
import { formatTime } from "./Recorder";
import { Waveform } from "./Waveform";

type Action = { added: Cut[]; removed: Cut[] };

type Props = {
  project: Project;
  audioUrl: string;
  initialCuts: Cut[];
  exportJob: Job | null;
};

export function Editor({ project, audioUrl, initialCuts, exportJob }: Props) {
  const words = useMemo(() => project.words ?? [], [project.words]);
  const duration = project.duration_seconds ?? (words.length ? words[words.length - 1].end : 0);
  const sentences = useMemo(() => groupSentences(words), [words]);

  const [cuts, setCuts] = useState<Cut[]>(initialCuts);
  const [undoStack, setUndoStack] = useState<Action[]>([]);
  const [redoStack, setRedoStack] = useState<Action[]>([]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [skipCuts, setSkipCuts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [exportState, setExportState] = useState<{ status: string; progress: number; error?: string | null }>(
    exportJob ? { status: exportJob.status, progress: exportJob.progress, error: exportJob.error } : { status: "none", progress: 0 },
  );
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ from: number; to: number } | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef(0);
  const merged = useMemo(() => mergeCuts(cuts), [cuts]);
  const mergedRef = useRef(merged);
  mergedRef.current = merged;
  const skipRef = useRef(skipCuts);
  skipRef.current = skipCuts;

  const hasSilenceCuts = cuts.some((c) => c.kind === "silence");
  const finalLen = useMemo(() => finalDuration(cuts, duration), [cuts, duration]);

  // ---------- Lecture synchronisée ----------
  const loop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (skipRef.current) {
      const target = skipTarget(mergedRef.current, a.currentTime);
      if (target != null) a.currentTime = Math.min(target, a.duration || target);
    }
    setTime(a.currentTime);
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => {
      setPlaying(true);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(rafRef.current);
      setTime(a.currentTime);
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onPause);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onPause);
      cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  const seek = useCallback(
    (t: number) => {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = Math.max(0, Math.min(t, duration));
      setTime(a.currentTime);
    },
    [duration],
  );

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  }, []);

  // ---------- Coupes (non destructives, persistées) ----------
  const persist = useCallback(
    async (action: Action) => {
      const supabase = createClient();
      setSaving(true);
      setSaveError("");
      try {
        if (action.removed.length) {
          const { error } = await supabase.from("cuts").delete().eq("project_id", project.id).in("id", action.removed.map((c) => c.id));
          if (error) throw error;
        }
        if (action.added.length) {
          const { error } = await supabase
            .from("cuts")
            .upsert(action.added.map((c) => ({ id: c.id, project_id: project.id, start_s: c.start, end_s: c.end, kind: c.kind })));
          if (error) throw error;
        }
      } catch {
        setSaveError("Modification non enregistrée — vérifiez votre connexion.");
      } finally {
        setSaving(false);
      }
    },
    [project.id],
  );

  const apply = useCallback(
    (action: Action, record: "undo" | "none" = "undo") => {
      if (!action.added.length && !action.removed.length) return;
      const removedIds = new Set(action.removed.map((c) => c.id));
      setCuts((prev) => [...prev.filter((c) => !removedIds.has(c.id)), ...action.added]);
      if (record === "undo") {
        setUndoStack((s) => [...s, action]);
        setRedoStack([]);
      }
      void persist(action);
    },
    [persist],
  );

  const invert = (a: Action): Action => ({ added: a.removed, removed: a.added });

  function undo() {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    apply(invert(last), "none");
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((r) => [...r, last]);
  }

  function redo() {
    const last = redoStack[redoStack.length - 1];
    if (!last) return;
    apply(last, "none");
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((s) => [...s, last]);
  }

  /** Coupe manuelle couvrant une plage de mots (de from à to inclus). */
  const cutForWords = useCallback(
    (from: number, to: number): Cut => {
      // On coupe jusqu'au début du mot suivant pour ne pas laisser de pause orpheline.
      const next = words[to + 1];
      const start = words[from].start;
      const end = next ? Math.max(words[to].end, next.start - 0.05) : Math.min(duration, words[to].end + 0.1);
      return { id: crypto.randomUUID(), start, end, kind: "manual" };
    },
    [words, duration],
  );

  const manualCutsCovering = useCallback(
    (start: number, end: number) => cuts.filter((c) => c.kind === "manual" && c.start < end - 1e-3 && c.end > start + 1e-3),
    [cuts],
  );

  const isWordCut = useCallback((i: number) => merged.some((c) => words[i].start >= c.start - 1e-3 && words[i].end <= c.end + 1e-3), [merged, words]);

  function toggleRange(from: number, to: number) {
    const all = Array.from({ length: to - from + 1 }, (_, k) => from + k);
    const allCut = all.every(isWordCut);
    const range = cutForWords(from, to);
    if (allCut) {
      // Rétablir uniquement cette plage : les coupes qui débordent sont redécoupées autour.
      const removed = manualCutsCovering(range.start, range.end);
      const added: Cut[] = [];
      for (const c of removed) {
        if (range.start - c.start > 0.02) added.push({ id: crypto.randomUUID(), start: c.start, end: range.start, kind: "manual" });
        if (c.end - range.end > 0.02) added.push({ id: crypto.randomUUID(), start: range.end, end: c.end, kind: "manual" });
      }
      apply({ added, removed });
    } else {
      apply({ added: [range], removed: [] });
    }
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }

  function toggleSilences() {
    if (hasSilenceCuts) apply({ added: [], removed: cuts.filter((c) => c.kind === "silence") });
    else apply({ added: silenceCuts(words, duration).map((c) => ({ ...c, id: crypto.randomUUID() })), removed: [] });
  }

  // Sélection de texte à la souris → plage de mots
  useEffect(() => {
    const onUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return setSelection(null);
      const idx = (n: Node | null) => {
        const el = n instanceof Element ? n : n?.parentElement;
        const w = el?.closest<HTMLElement>("[data-w]");
        return w ? Number(w.dataset.w) : null;
      };
      const a = idx(sel.anchorNode);
      const b = idx(sel.focusNode);
      if (a == null || b == null) return setSelection(null);
      setSelection({ from: Math.min(a, b), to: Math.max(a, b) });
    };
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchend", onUp);
    };
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selection) {
        e.preventDefault();
        toggleRange(selection.from, selection.to);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------- Export ----------
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`export-${project.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs", filter: `project_id=eq.${project.id}` }, async (payload) => {
        const job = payload.new as Job;
        if (job.type !== "export") return;
        setExportState({ status: job.status, progress: job.progress, error: job.error });
        if (job.status === "done") {
          const { data: p } = await supabase.from("projects").select("export_path").eq("id", project.id).single();
          if (p?.export_path) {
            const { data } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(p.export_path, 3600, { download: `${project.title}.mp3` });
            setDownloadUrl(data?.signedUrl ?? null);
          }
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id, project.title]);

  async function startExport() {
    setDownloadUrl(null);
    setExportState({ status: "queued", progress: 0 });
    const supabase = createClient();
    const { error } = await supabase.rpc("enqueue_job", { p_project: project.id, p_type: "export" });
    if (error) setExportState({ status: "error", progress: 0, error: error.message });
  }

  function downloadTxt() {
    const blob = new Blob([transcriptToTxt(words, cuts)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentWord = useMemo(() => {
    let lo = 0;
    let hi = words.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (words[mid].end < time) lo = mid + 1;
      else if (words[mid].start > time) hi = mid - 1;
      else return mid;
    }
    return -1;
  }, [time, words]);

  const exporting = exportState.status === "queued" || exportState.status === "running";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {/* Barre d'outils */}
      <div className="card" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, position: "sticky", top: 8, zIndex: 5, boxShadow: "0 6px 20px rgba(27,26,34,.06)" }}>
        <button className="btn btn-violet" onClick={togglePlay} style={{ width: 48, height: 48, padding: 0 }} aria-label={playing ? "Pause" : "Lecture"}>
          {playing ? "❚❚" : "►"}
        </button>
        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
          {formatTime(time)} <span className="muted">/ {formatTime(duration)}</span>
        </span>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
          <input type="checkbox" checked={skipCuts} onChange={(e) => setSkipCuts(e.target.checked)} />
          Écouter le résultat
        </label>
        <span style={{ flex: 1 }} />
        <button className="btn btn-blanc" onClick={undo} disabled={!undoStack.length} title="Annuler (Ctrl+Z)">
          ↶ Annuler
        </button>
        <button className="btn btn-blanc" onClick={redo} disabled={!redoStack.length} title="Rétablir (Ctrl+Y)">
          ↷
        </button>
        <button className="btn btn-blanc" onClick={toggleSilences}>
          {hasSilenceCuts ? "Remettre les silences" : "Couper les silences"}
        </button>
      </div>

      <Waveform peaks={project.peaks ?? []} duration={duration} time={time} cuts={merged} onSeek={seek} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13 }} className="muted">
        <span>
          Durée finale : <strong style={{ color: "var(--encre)" }}>{formatTime(finalLen)}</strong> (−{formatTime(duration - finalLen)})
        </span>
        <span>{saving ? "Enregistrement…" : "Modifications enregistrées"}</span>
        {saveError && <span className="error">{saveError}</span>}
      </div>

      {selection && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-noir" onClick={() => toggleRange(selection.from, selection.to)}>
            ✂ Couper / rétablir la sélection
          </button>
          <span className="muted" style={{ fontSize: 13 }}>ou touche Suppr</span>
        </div>
      )}

      {/* Transcription cliquable */}
      <div className="card" style={{ padding: "8px 8px", lineHeight: 1.9, fontSize: 17 }}>
        {sentences.map((s) => {
          const allCut = s.wordIndexes.every(isWordCut);
          return (
            <div key={s.index} className="sentence" style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 10px", borderRadius: 12 }}>
              <button
                onClick={() => toggleRange(s.wordIndexes[0], s.wordIndexes[s.wordIndexes.length - 1])}
                title={allCut ? "Rétablir la phrase" : "Barrer la phrase"}
                aria-label={allCut ? "Rétablir la phrase" : "Barrer la phrase"}
                style={{
                  flex: "none",
                  marginTop: 6,
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  border: 0,
                  background: allCut ? "var(--cobalt)" : "#fff",
                  color: allCut ? "#fff" : "var(--gris)",
                  fontSize: 13,
                }}
              >
                {allCut ? "↺" : "✂"}
              </button>
              <p style={{ margin: 0 }}>
                {s.wordIndexes.map((i) => {
                  const cut = isWordCut(i);
                  const active = i === currentWord;
                  return (
                    <span
                      key={i}
                      data-w={i}
                      onClick={() => {
                        if (window.getSelection()?.isCollapsed !== false) seek(words[i].start);
                      }}
                      style={{
                        cursor: "pointer",
                        borderRadius: 4,
                        padding: "1px 1px",
                        textDecoration: cut ? "line-through" : "none",
                        textDecorationColor: "var(--cobalt)",
                        textDecorationThickness: "2px",
                        color: cut ? "var(--gris)" : "var(--encre)",
                        background: active ? "rgba(58,208,245,.35)" : cut ? "rgba(63,124,246,.08)" : "transparent",
                      }}
                    >
                      {words[i].text}{" "}
                    </span>
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Export */}
      <div style={{ borderRadius: 22, padding: 22, background: "var(--grad-violet)", color: "#fff", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ flex: "1 1 240px" }}>
          <strong style={{ fontSize: 18 }}>Exporter</strong>
          <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.92 }}>
            {exporting
              ? `Assemblage en cours… ${Math.round(exportState.progress * 100)} %`
              : exportState.status === "error"
                ? `Échec : ${exportState.error ?? "erreur inconnue"}`
                : "MP3 normalisé à -16 LUFS, fondus anti-clics à chaque coupe."}
          </p>
        </div>
        <button className="btn" style={{ background: "#fff", color: "var(--encre)" }} onClick={downloadTxt}>
          Texte (TXT)
        </button>
        {downloadUrl ? (
          <a className="btn" style={{ background: "var(--encre)", color: "#fff" }} href={downloadUrl}>
            Télécharger le MP3
          </a>
        ) : (
          <button className="btn" style={{ background: "#fff", color: "var(--encre)" }} onClick={startExport} disabled={exporting}>
            {exporting ? "Export…" : "Exporter en MP3"}
          </button>
        )}
      </div>

      <style>{`.sentence:hover{background:rgba(255,255,255,.7)}`}</style>
    </div>
  );
}
