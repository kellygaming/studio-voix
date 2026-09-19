import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function Header({ marketing = false }: { marketing?: boolean }) {
  let connected = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    connected = !!data.user;
  } catch {
    // Variables Supabase absentes (ex. aperçu) : on affiche le header déconnecté.
  }

  return (
    <header className={marketing ? "site-header" : undefined} style={marketing ? undefined : { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, height: 56 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--encre)" }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--violet)" }} />
        <strong style={{ fontSize: 16, fontWeight: 700 }}>Studio Voix</strong>
      </Link>
      {marketing && (
        <nav className="site-nav" aria-label="Navigation principale">
          <a href="#outils">Les outils</a>
          <a href="#demo">Comment ça marche</a>
          <a href="#tarifs">Les offres</a>
        </nav>
      )}
      {connected ? (
        <Link href="/projets" className="btn btn-noir">
          Mes projets
        </Link>
      ) : (
        <Link href="/connexion" className="btn btn-noir">
          Se connecter
        </Link>
      )}
    </header>
  );
}
