import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  let connected = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    connected = !!data.user;
  } catch {
    // Variables Supabase absentes (ex. aperçu) : on affiche le header déconnecté.
  }

  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, height: 56 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--encre)" }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--violet)" }} />
        <strong style={{ fontSize: 16, fontWeight: 700 }}>Studio Voix</strong>
      </Link>
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
