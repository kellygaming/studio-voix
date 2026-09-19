import Link from "next/link";

/** Marque Studio Voix : un seul endroit pour le logo, partout dans le site. */
export function Logo({ href = "/", sombre = false }: { href?: string | null; sombre?: boolean }) {
  const contenu = (
    <>
      <span className="logo-mark" aria-hidden="true" />
      <strong>Studio Voix</strong>
    </>
  );
  const classe = `logo${sombre ? " logo-sombre" : ""}`;
  return href ? (
    <Link href={href} className={classe}>
      {contenu}
    </Link>
  ) : (
    <span className={classe}>{contenu}</span>
  );
}
