import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ProjectView } from "@/components/ProjectView";
import { requireUser } from "@/lib/profile";
import { AUDIO_BUCKET, type CutRow, type Job, type Project } from "@/lib/types";

export default async function ProjetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser(`/projets/${id}`);

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single<Project>();
  if (!project) notFound();

  const [{ data: cutRows }, { data: jobs }] = await Promise.all([
    supabase.from("cuts").select("id, start_s, end_s, kind").eq("project_id", id),
    supabase.from("jobs").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(5),
  ]);

  let audioUrl: string | null = null;
  const playable = project.preview_path ?? project.clean_path;
  if (playable) {
    const { data } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(playable, 60 * 60 * 6);
    audioUrl = data?.signedUrl ?? null;
  }

  const cuts: CutRow[] = (cutRows ?? []).map((c) => ({ id: c.id, start: c.start_s, end: c.end_s, kind: c.kind, project_id: id }));

  return (
    <div className="page" style={{ gap: 24 }}>
      <Header />
      <ProjectView project={project} initialCuts={cuts} initialJobs={(jobs ?? []) as Job[]} audioUrl={audioUrl} />
    </div>
  );
}
