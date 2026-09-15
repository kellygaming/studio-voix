import { Header } from "@/components/Header";
import { Recorder } from "@/components/Recorder";
import { requireUser } from "@/lib/profile";

export default async function EnregistrerPage({ searchParams }: { searchParams: Promise<{ modele?: string }> }) {
  const { modele } = await searchParams;
  const template = ["podcast", "cours", "note"].includes(modele ?? "") ? modele! : "libre";
  const { user, plan } = await requireUser("/enregistrer");

  return (
    <div className="page" style={{ maxWidth: 720, gap: 28 }}>
      <Header />
      <div>
        <h1 className="h2" style={{ fontSize: 34 }}>
          Nouvel enregistrement
        </h1>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          Placez le téléphone à une main de votre bouche, dans une pièce calme. Parlez normalement.
        </p>
      </div>
      <Recorder userId={user.id} planLabel={plan.label} maxSeconds={plan.maxRecordingSeconds} template={template} />
    </div>
  );
}
