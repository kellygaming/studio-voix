import { Header } from "@/components/Header";
import { Recorder } from "@/components/Recorder";
import { requireUser } from "@/lib/profile";

export default async function EnregistrerPage({ searchParams }: { searchParams: Promise<{ modele?: string }> }) {
  const { modele } = await searchParams;
  const template = ["podcast", "cours", "note"].includes(modele ?? "") ? modele! : "libre";
  const { user, plan } = await requireUser("/enregistrer");

  return (
    <div className="record-page">
      <Header />
      <main className="record-main">
        <header className="record-intro">
          <span className="record-eyebrow"><i /> Studio d’enregistrement</span>
          <h1>Une prise simple.<br /><em>Une voix plus claire.</em></h1>
          <p>Enregistrez naturellement. Studio Voix s’occupe ensuite du souffle, des bruits de fond et de l’équilibre sonore.</p>
          <div className="record-reassurance"><span>✓ Sans installation</span><span>✓ Sauvegarde automatique</span><span>✓ Audio privé</span></div>
        </header>
        <Recorder userId={user.id} planLabel={plan.label} maxSeconds={plan.maxRecordingSeconds} template={template} />
        <aside className="record-tips" aria-label="Conseils pour un meilleur enregistrement">
          <strong>Pour une meilleure prise</strong>
          <div><span>01</span><p>Gardez le téléphone à une main de votre bouche.</p></div>
          <div><span>02</span><p>Parlez normalement, sans forcer votre voix.</p></div>
          <div><span>03</span><p>Éloignez-vous des ventilateurs si possible.</p></div>
        </aside>
      </main>
    </div>
  );
}
