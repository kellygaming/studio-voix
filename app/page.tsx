import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { IMAGES } from "@/lib/images";

const featureCards = [
  {
    bg: "var(--grad-violet)",
    icon: <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-7 9a7 7 0 0 0 14 0M12 19v3" />,
    title: "Enregistrer en haute qualité",
    text: "Capture 48 kHz directement dans le navigateur, sans filtres qui abîment la voix.",
    cta: "Lancer un enregistrement",
    href: "/enregistrer",
  },
  {
    bg: "linear-gradient(145deg, #235acc, #167c9f)",
    icon: <path d="M3 12h2l2-6 3 12 3-9 2 5 2-2h4" />,
    title: "Nettoyer le son",
    text: "Bruits ambiants, écho, souffle : supprimés en un clic.",
    cta: "Nettoyer un fichier",
    href: "/enregistrer",
  },
  {
    bg: "linear-gradient(145deg, #117d5a, #087980)",
    icon: <path d="M4 6h16M4 12h10M4 18h7M15 15l5 5M20 15l-5 5" />,
    title: "Éditer comme un texte",
    text: "Barrez une phrase, elle disparaît de l'audio. Les silences se coupent tout seuls.",
    cta: "Essayer l'éditeur",
    href: "/projets",
  },
];

const smallFeatures = [
  { bg: "#fff6ea", dot: "#ff9a3c", title: "Transcription en direct", text: "Le texte s'écrit pendant que vous parlez. Export TXT inclus." },
  { bg: "#fdeef3", dot: "#f0508a", title: "Couper les silences", text: "Les pauses trop longues sont réduites, le rythme reste naturel." },
  { bg: "#ecf1ff", dot: "#4a7df0", title: "Export MP3 normalisé", text: "Un fichier prêt à publier, au bon volume, sans clics." },
];

const projects = [
  { title: "Podcast", img: IMAGES.projetPodcast, template: "podcast" },
  { title: "Cours magistral", img: IMAGES.projetCours, template: "cours" },
  { title: "Note vocale pro", img: IMAGES.projetNote, template: "note" },
];

const details = [
  {
    img: IMAGES.detailSonPropre,
    title: "Un son propre en un seul clic",
    text: "Concentrez-vous sur ce que vous dites. Le nettoyage retire les bruits de fond, l'écho et le souffle pour une qualité proche du studio, même enregistré au téléphone.",
  },
  {
    img: IMAGES.detailEdition,
    title: "Modifiez votre audio comme un document texte",
    text: "Chaque mot est lié à l'audio. Barrez une phrase, elle est coupée. Annulez, elle revient. L'original n'est jamais touché.",
  },
  {
    img: IMAGES.detailEnregistrement,
    title: "Enregistrement de qualité professionnelle",
    text: "Capture 48 kHz directement depuis le navigateur, sans filtres automatiques qui dégradent la voix. Aucun micro pro nécessaire.",
  },
  {
    img: IMAGES.detailTranscription,
    title: "Le texte s'écrit pendant que vous parlez",
    text: "Transcription en direct en français, puis une version finale précise avec le minutage de chaque mot. Téléchargez le TXT.",
  },
];

const legalLinks = [
  { label: "Règles de confidentialité", href: "/confidentialite" },
  { label: "Conditions d'utilisation", href: "/conditions" },
];

export default function Home() {
  return (
    <div className="home">
      <Header marketing />
      <main id="contenu">

      <section className="home-hero" aria-labelledby="hero-title">
        <div className="home-container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Votre voix. Toutes vos idées.</span>
            <h1 id="hero-title">Une voix de studio,<br /><span>sans micro pro.</span></h1>
            <p>Enregistrez, nettoyez le son et éditez votre audio comme un texte. Votre studio est déjà dans votre navigateur.</p>
            <div className="hero-actions">
              <Link href="/enregistrer" className="btn btn-violet">Commencer gratuitement <span aria-hidden="true">↗</span></Link>
              <a href="#demo" className="btn btn-blanc">Découvrir le studio</a>
            </div>
            <p className="hero-note">3 minutes offertes · Rien à installer</p>
          </div>
          <div className="hero-visual">
            <div className="media hero-image">
              <Image src={IMAGES.hero} alt="Une femme enregistre sa voix avec son téléphone" fill priority sizes="(max-width: 760px) 100vw, 50vw" />
            </div>
            <div className="hero-badge"><span className="record-dot" /> Les bonnes idées méritent un beau son.</div>
          </div>
        </div>
      </section>
      <div className="home-container home-content">
      {/* CARTES */}
      <section id="outils" className="tools-section" aria-label="Les outils Studio Voix">
        <div className="tools-grid">
        {featureCards.map((c) => (
          <div
            key={c.title}
            className="tool-card" style={{ background: c.bg }}
          >
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.22)", display: "grid", placeItems: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {c.icon}
              </svg>
            </span>
            <h2>{c.title}</h2>
            <p>{c.text}</p>
            <Link href={c.href} className="btn btn-blanc">
              {c.cta}
            </Link>
          </div>
        ))}
        </div>
        <div className="small-tools-grid">
        {smallFeatures.map((f) => (
          <div key={f.title} className="small-tool" style={{ background: f.bg }}>
            <span style={{ flex: "none", width: 36, height: 36, borderRadius: 10, background: f.dot }} />
            <div>
              <strong>{f.title}</strong>
              <span className="small-tool-description">{f.text}</span>
            </div>
          </div>
        ))}
        </div>
      </section>

      {/* NAVIGATEUR */}
      <section id="demo" className="demo-section center">
        <span className="eyebrow">Simple, du premier mot au fichier final</span>
        <h2 className="h2">
          Enregistrez et améliorez votre voix sans télécharger de logiciel
        </h2>
        <p style={{ margin: 0, fontSize: 16, color: "var(--gris)", fontWeight: 600 }}>Tout se passe dans le navigateur, sur téléphone ou ordinateur.</p>
        <div className="media demo-image">
          <Image src={IMAGES.editeur} alt="L'éditeur Studio Voix : forme d'onde et transcription avec une phrase barrée" fill sizes="(max-width: 760px) 100vw, 85vw" />
        </div>
      </section>

      {/* PROJETS */}
      <section className="projects-section">
        <div className="center">
          <h2 className="h2">Lancez-vous dans un projet</h2>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--texte)", maxWidth: 720 }}>
            Un podcast, un cours, une note vocale pour vos clients : choisissez un modèle et parlez.
          </p>
        </div>
        <div className="projects-grid">
          {projects.map((p) => (
            <article key={p.title} className="project-card">
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{p.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                <Link href={`/enregistrer?modele=${p.template}`} className="btn btn-noir">
                  Ouvrir le projet
                </Link>
              </div>
              <div className="media project-image">
                <Image src={p.img} alt={p.title} fill sizes="(max-width: 760px) 100vw, 33vw" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="details-section" aria-label="Découvrez le studio">
        {details.map((d, index) => (
          <article key={d.title} className="detail-row">
            <div className="detail-copy">
              <span className="eyebrow">0{index + 1} / {['Un son plus clair', 'Le montage devient simple', 'À vous de parler', 'Chaque mot compte'][index]}</span>
              <h2 className="h2">{d.title}</h2>
              <p>{d.text}</p>
              <Link className="detail-link" href="/enregistrer">Essayer Studio Voix <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="media detail-image">
              <Image src={d.img} alt="" fill sizes="(max-width: 760px) 100vw, 50vw" />
            </div>
          </article>
        ))}
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="pricing-section">
        <div className="center">
          <h2 className="h2">Deux offres, paiement Mobile Money</h2>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--texte)" }}>Essai gratuit : 3 minutes d&apos;enregistrement.</p>
        </div>
        <div className="pricing-grid">
          <div style={{ border: "1px solid var(--bord)", borderRadius: 22, padding: "26px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
            <strong style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gris)" }}>Standard</strong>
            <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em" }}>
              — <small style={{ fontSize: 14, fontWeight: 600, color: "var(--gris)" }}>/ mois</small>
            </span>
            <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: 14, lineHeight: 1.7, color: "var(--texte)" }}>
              <li>Nettoyage du son standard</li>
              <li>Transcription en direct + TXT</li>
              <li>Édition par texte, coupe des silences</li>
              <li>Export MP3</li>
            </ul>
            <Link href="/connexion?offre=standard" className="btn" style={{ marginTop: "auto", background: "var(--encre)", color: "#fff", fontSize: 14 }}>
              Choisir Standard
            </Link>
          </div>
          <div style={{ borderRadius: 22, padding: "26px 22px", display: "flex", flexDirection: "column", gap: 12, background: "var(--grad-violet)", color: "#fff" }}>
            <strong style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.9 }}>Voix Studio</strong>
            <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em" }}>
              — <small style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>/ mois</small>
            </span>
            <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: 14, lineHeight: 1.7 }}>
              <li>Nettoyage du son qualité studio</li>
              <li>Tout Standard inclus</li>
              <li>Durées d&apos;enregistrement étendues</li>
              <li>Traitement prioritaire</li>
            </ul>
            <Link href="/connexion?offre=studio" className="btn" style={{ marginTop: "auto", background: "#fff", color: "var(--encre)", fontSize: 14 }}>
              Choisir Voix Studio
            </Link>
          </div>
        </div>
      </section>

      </div>
      </main>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="home-container footer-inner">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 22 }}>
          <FooterCol title="Cas d'utilisation" links={["Podcast", "Cours et formations", "Notes vocales pro", "Voix off"]} />
          <FooterCol title="Guides" links={["Bien enregistrer avec un téléphone", "Supprimer une phrase de l'audio", "Couper les silences", "Exporter en MP3"]} />
          <FooterCol title="Ressources" links={["Tarifs", "Aide", "Contact"]} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--bord)", paddingTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--violet)" }} />
            <strong style={{ fontSize: 14 }}>Studio Voix</strong>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href} style={{ fontSize: 12, color: "var(--gris)" }}>
                {l.label}
              </Link>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "var(--gris)" }}>© 2026 Studio Voix. Tous droits réservés.</span>
        </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <strong style={{ fontSize: 13 }}>{title}</strong>
      {links.map((l) => (
        <a key={l} href={l === "Tarifs" ? "#tarifs" : "#"} style={{ fontSize: 13, color: "var(--texte)" }}>
          {l}
        </a>
      ))}
    </div>
  );
}
