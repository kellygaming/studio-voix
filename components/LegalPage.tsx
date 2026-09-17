import Link from "next/link";
import { Header } from "@/components/Header";
import { LEGAL } from "@/lib/legal";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="page" style={{ maxWidth: 760, gap: 28 }}>
      <Header />
      <article className="legal">
        <h1 className="h2" style={{ fontSize: 36 }}>
          {title}
        </h1>
        <p className="muted" style={{ marginTop: 8 }}>Dernière mise à jour : {LEGAL.miseAJour}</p>
        {children}
      </article>
      <footer style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, borderTop: "1px solid var(--bord)", paddingTop: 18 }}>
        <Link href="/">Accueil</Link>
        <Link href="/confidentialite">Règles de confidentialité</Link>
        <Link href="/conditions">Conditions d&apos;utilisation</Link>
      </footer>
      <style>{`
        .legal h2 { font-size: 21px; font-weight: 800; margin: 32px 0 8px; letter-spacing: -0.01em; }
        .legal p, .legal li { font-size: 15px; line-height: 1.65; color: var(--texte); }
        .legal ul { padding-left: 20px; margin: 8px 0; }
        .legal li { margin: 4px 0; }
        .legal table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px; }
        .legal th, .legal td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--bord); vertical-align: top; color: var(--texte); }
        .legal th { color: var(--encre); font-weight: 700; }
        .legal .table-wrap { overflow-x: auto; }
      `}</style>
    </div>
  );
}

export function Contact() {
  return LEGAL.contactEmail ? (
    <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
  ) : (
    <span>l&apos;adresse de contact indiquée sur le site</span>
  );
}
