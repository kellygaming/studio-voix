import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { IMAGES } from "@/lib/images";

const noises = [
  { icon: "🚗", title: "Circulation", text: "Moteurs, klaxons et bruit de rue sont fortement atténués." },
  { icon: "❄️", title: "Frigo & ventilation", text: "Les ronronnements continus passent à l’arrière-plan." },
  { icon: "〰", title: "Souffle du micro", text: "Le souffle et les parasites deviennent beaucoup moins présents." },
  { icon: "◌", title: "Respirations", text: "Les respirations gênantes sont adoucies pour une écoute plus fluide." },
];

const steps = [
  { number: "01", title: "Enregistrez", text: "Parlez depuis votre téléphone ou votre ordinateur. Aucun micro professionnel nécessaire." },
  { number: "02", title: "Laissez le studio nettoyer", text: "Le traitement analyse votre piste et réduit les bruits qui couvrent la voix." },
  { number: "03", title: "Éditez et exportez", text: "Corrigez votre audio depuis la transcription, puis récupérez un MP3 prêt à partager." },
];

const projects = [
  { title: "Podcast", label: "Une voix nette pour chaque épisode", img: IMAGES.projetPodcast, template: "podcast" },
  { title: "Cours & formation", label: "Des explications faciles à suivre", img: IMAGES.projetCours, template: "cours" },
  { title: "Note vocale pro", label: "Un message clair pour vos clients", img: IMAGES.projetNote, template: "note" },
];

const legalLinks = [
  { label: "Règles de confidentialité", href: "/confidentialite" },
  { label: "Conditions d’utilisation", href: "/conditions" },
];

export default function Home() {
  return (
    <div className="home home-pro">
      <Header marketing />
      <main id="contenu">
        <section className="pro-hero" aria-labelledby="hero-title">
          <div className="home-container pro-hero-grid">
            <div className="pro-hero-copy">
              <div className="pro-kicker"><span /> Nettoyage vocal intelligent</div>
              <h1 id="hero-title">La voix reste.<br /><em>Le bruit s’efface.</em></h1>
              <p className="pro-lead">Enregistrez où vous voulez. Studio Voix réduit les bruits de voiture, le ronronnement du frigo, le souffle et les respirations gênantes pour rapprocher votre voix d’un rendu studio.</p>
              <div className="hero-actions">
                <Link href="/enregistrer" className="btn pro-primary">Tester gratuitement sur ma voix <span aria-hidden="true">↗</span></Link>
                <a href="#avant-apres" className="btn pro-secondary">Voir le résultat</a>
              </div>
              <div className="pro-trust" aria-label="Avantages de l’essai">
                <span>✓ 3 minutes offertes</span><span>✓ Sans installation</span><span>✓ En français</span>
              </div>
            </div>
            <div className="pro-hero-art">
              <div className="media pro-hero-image">
                <Image src={IMAGES.hero} alt="Créatrice enregistrant sa voix avec son téléphone" fill priority sizes="(max-width: 760px) 100vw, 48vw" />
              </div>
              <div className="pro-floating-card">
                <div className="pro-card-top"><span className="pro-live-dot" /> Nettoyage terminé <strong>98%</strong></div>
                <div className="pro-wave clean" aria-hidden="true">{Array.from({ length: 32 }).map((_, i) => <i key={i} style={{ height: 8 + ((i * 13) % 34) }} />)}</div>
                <div className="pro-card-bottom"><span>Voix mise en avant</span><b>Prêt à écouter</b></div>
              </div>
            </div>
          </div>
        </section>

        <section className="pro-proof-strip">
          <div className="home-container">
            <span>Conçu pour les voix enregistrées dans la vraie vie</span>
            <div><b>Podcast</b><b>Formation</b><b>Voix off</b><b>Messages clients</b></div>
          </div>
        </section>

        <section id="outils" className="home-container pro-noise-section">
          <div className="pro-section-heading">
            <span className="pro-kicker"><span /> Votre voix au premier plan</span>
            <h2>Les bruits du quotidien ne devraient pas gâcher une bonne idée.</h2>
            <p>Studio Voix cible les sons les plus gênants tout en conservant une voix naturelle.</p>
          </div>
          <div className="pro-noise-grid">
            {noises.map((noise) => (
              <article key={noise.title} className="pro-noise-card">
                <span className="pro-noise-icon" aria-hidden="true">{noise.icon}</span>
                <h3>{noise.title}</h3>
                <p>{noise.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="avant-apres" className="pro-compare-wrap">
          <div className="home-container pro-compare-grid">
            <div className="pro-compare-copy">
              <span className="pro-kicker light"><span /> Écoutez la différence</span>
              <h2>De la pièce bruyante à une voix claire.</h2>
              <p>Le bruit est réduit, le volume est équilibré et votre voix reste naturelle. Le résultat dépend de l’enregistrement d’origine.</p>
              <Link href="/enregistrer" className="btn pro-light-btn">Nettoyer mon premier audio <span aria-hidden="true">→</span></Link>
            </div>
            <div className="pro-compare-panel">
              <div className="pro-audio-row before">
                <div className="pro-audio-label"><span>Avant</span><small>Voiture · frigo · souffle</small></div>
                <span className="pro-play" aria-hidden="true">▶</span>
                <div className="pro-wave noisy" aria-hidden="true">{Array.from({ length: 40 }).map((_, i) => <i key={i} style={{ height: 10 + ((i * 17) % 44) }} />)}</div>
              </div>
              <div className="pro-audio-row after">
                <div className="pro-audio-label"><span>Après Studio Voix</span><small>Voix claire et équilibrée</small></div>
                <span className="pro-play" aria-hidden="true">▶</span>
                <div className="pro-wave clean" aria-hidden="true">{Array.from({ length: 40 }).map((_, i) => <i key={i} style={{ height: 8 + ((i * 11) % 34) }} />)}</div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="home-container pro-steps-section">
          <div className="pro-section-heading compact">
            <span className="pro-kicker"><span /> Rien de technique</span>
            <h2>Un studio simple, du premier mot au fichier final.</h2>
          </div>
          <div className="pro-steps-grid">
            {steps.map((step) => (
              <article key={step.number} className="pro-step">
                <span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p>
              </article>
            ))}
          </div>
          <div className="media pro-editor-image">
            <Image src={IMAGES.editeur} alt="Éditeur Studio Voix avec forme d’onde et transcription" fill sizes="(max-width: 760px) 100vw, 88vw" />
          </div>
        </section>

        <section className="home-container pro-projects">
          <div className="pro-section-heading compact">
            <span className="pro-kicker"><span /> Prêt pour vos projets</span>
            <h2>Votre voix, partout où elle doit être entendue.</h2>
          </div>
          <div className="projects-grid">
            {projects.map((project) => (
              <article key={project.title} className="pro-project-card">
                <div className="media pro-project-image"><Image src={project.img} alt={project.title} fill sizes="(max-width: 760px) 100vw, 33vw" /></div>
                <div><h3>{project.title}</h3><p>{project.label}</p><Link href={"/enregistrer?modele=" + project.template}>Créer ce projet <span aria-hidden="true">↗</span></Link></div>
              </article>
            ))}
          </div>
        </section>

        <section id="tarifs" className="home-container pro-pricing">
          <div className="pro-section-heading compact">
            <span className="pro-kicker"><span /> Commencez sans risque</span>
            <h2>Testez votre voix gratuitement.</h2>
            <p>3 minutes offertes pour entendre ce que Studio Voix peut faire avec votre propre enregistrement.</p>
          </div>
          <div className="pro-price-grid">
            <article className="pro-price-card">
              <span>Standard</span><h3>Pour publier régulièrement</h3>
              <ul><li>120 minutes par mois</li><li>Nettoyage des bruits de fond</li><li>Transcription et édition par texte</li><li>Export MP3 normalisé</li></ul>
              <Link href="/connexion?offre=standard" className="btn pro-secondary">Choisir Standard</Link>
            </article>
            <article className="pro-price-card featured">
              <div className="pro-popular">Qualité maximale</div><span>Voix Studio</span><h3>Pour un rendu proche du studio</h3>
              <ul><li>300 minutes par mois</li><li>Isolation vocale avancée</li><li>Tout Standard inclus</li><li>Traitement prioritaire</li></ul>
              <Link href="/connexion?offre=studio" className="btn pro-primary">Choisir Voix Studio</Link>
            </article>
          </div>
        </section>

        <section className="home-container pro-final-cta">
          <div><span className="pro-kicker light"><span /> Votre première minute est à vous</span><h2>Votre voix mérite d’être entendue, pas le bruit autour.</h2></div>
          <Link href="/enregistrer" className="btn pro-light-btn">Essayer Studio Voix gratuitement <span aria-hidden="true">↗</span></Link>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-container footer-inner">
          <div className="pro-footer-brand"><span className="pro-logo-mark" /><div><strong>Studio Voix</strong><p>Votre studio vocal, directement dans le navigateur.</p></div></div>
          <div className="pro-footer-links">
            <a href="#outils">Nettoyage audio</a><a href="#demo">Comment ça marche</a><a href="#tarifs">Les offres</a>
            {legalLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </div>
          <span className="pro-copyright">© 2026 Studio Voix. Tous droits réservés.</span>
        </div>
      </footer>
    </div>
  );
}
