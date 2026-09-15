import Link from "next/link";
import { Header } from "@/components/Header";
import { requireUser } from "@/lib/profile";

const STATUS_LABEL: Record<string, string> = {
  recording: "Envoi incomplet",
  uploaded: "En attente",
  processing: "Traitement…",
  ready: "Prêt à éditer",
  error: "Erreur",
};

export default async function ProjetsPage() {
  const { supabase, plan } = await requireUser("/projets");
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, status, duration_seconds, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="page" style={{ gap: 28 }}>
      <Header />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="h2" style={{ fontSize: 34 }}>
            Mes projets
          </h1>
          <p className="muted" style={{ margin: "6px 0 0" }}>Offre {plan.label}</p>
        </div>
        <Link href="/enregistrer" className="btn btn-violet">
          Nouvel enregistrement
        </Link>
      </div>

      {!projects?.length ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ margin: 0 }}>Aucun projet pour l&apos;instant. Lancez votre premier enregistrement !</p>
        </div>
      ) : (
        <div className="grid-auto">
          {projects.map((p) => (
            <Link key={p.id} href={`/projets/${p.id}`} className="card" style={{ color: "var(--encre)", display: "flex", flexDirection: "column", gap: 8 }}>
              <strong style={{ fontSize: 18 }}>{p.title}</strong>
              <span className="muted" style={{ fontSize: 13 }}>
                {new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                {p.duration_seconds ? ` · ${Math.round(p.duration_seconds / 60) || "< 1"} min` : ""}
              </span>
              <span
                style={{
                  alignSelf: "flex-start",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: p.status === "ready" ? "#e3f7ee" : p.status === "error" ? "#fdeef3" : "#ecf1ff",
                  color: p.status === "ready" ? "#17895a" : p.status === "error" ? "#c0264f" : "#2f5fd0",
                }}
              >
                {STATUS_LABEL[p.status] ?? p.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
