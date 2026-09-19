import Link from "next/link";
import { Logo } from "@/components/Logo";
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
      <Logo />
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
