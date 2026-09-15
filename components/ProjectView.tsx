"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CutRow, Job, Project } from "@/lib/types";
import { Editor } from "./Editor";

const STEP_LABEL: Record<string, string> = {
  download: "Récupération de l'enregistrement",
  denoise: "Nettoyage du son",
  transcribe: "Transcription",
  finalize: "Préparation de l'éditeur",
  export: "Assemblage du MP3",
};

export function ProjectView({ project: initial, initialCuts, initialJobs, audioUrl }: { project: Project; initialCuts: CutRow[]; initialJobs: Job[]; audioUrl: string | null }) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [jobs, setJobs] = useState(initialJobs);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => setProject(initial), [initial]);
  useEffect(() => setJobs(initialJobs), [initialJobs]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`projet-${initial.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs", filter: `project_id=eq.${initial.id}` }, (payload) => {
        const job = payload.new as Job;
        setJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${initial.id}` }, (payload) => {
        const next = payload.new as Project;
        setProject((prev) => ({ ...prev, ...next }));
        // Passage à "prêt" : on recharge côté serveur pour obtenir l'URL signée de l'audio.
        if (next.status === "ready") router.refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [initial.id, router]);

  const processJob = jobs.find((j) => j.type === "process");
  const exportJob = jobs.find((j) => j.type === "export");

  async function retry() {
    setRetrying(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("enqueue_job", { p_project: project.id, p_type: "process" });
    if (error) alert(error.message);
    setRetrying(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 className="h2" style={{ fontSize: 32 }}>
        {project.title}
      </h1>

      {project.status === "ready" && audioUrl && project.words ? (
        <Editor project={project} audioUrl={audioUrl} initialCuts={initialCuts} exportJob={exportJob ?? null} />
      ) : project.status === "error" || processJob?.status === "error" ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <strong>Le traitement a échoué</strong>
          <p className="muted" style={{ margin: 0 }}>{processJob?.error ?? "Erreur inconnue"}</p>
          <button className="btn btn-violet" style={{ alignSelf: "flex-start" }} onClick={retry} disabled={retrying}>
            Relancer le traitement
          </button>
        </div>
      ) : (
        <Processing job={processJob} liveTranscript={project.live_transcript} />
      )}
    </div>
  );
}

function Processing({ job, liveTranscript }: { job?: Job; liveTranscript: string | null }) {
  const pct = Math.round((job?.progress ?? 0) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ borderRadius: 22, padding: 28, background: "var(--grad-bleu)", color: "#fff", display: "flex", flexDirection: "column", gap: 14 }}>
        <strong style={{ fontSize: 20 }}>{job?.step ? STEP_LABEL[job.step] ?? job.step : "En file d'attente"}…</strong>
        <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.3)", overflow: "hidden" }}>
          <div style={{ width: `${Math.max(4, pct)}%`, height: "100%", background: "#fff", transition: "width .4s" }} />
        </div>
        <span style={{ fontSize: 14, opacity: 0.9 }}>Vous pouvez fermer cette page : le traitement continue sur nos serveurs.</span>
      </div>
      {liveTranscript && (
        <div className="card">
          <strong style={{ display: "block", marginBottom: 8 }}>Transcription en direct (provisoire)</strong>
          <p style={{ margin: 0, lineHeight: 1.6, color: "var(--texte)" }}>{liveTranscript}</p>
        </div>
      )}
    </div>
  );
}
