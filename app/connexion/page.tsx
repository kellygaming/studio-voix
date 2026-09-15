"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  return (
    <Suspense>
      <Connexion />
    </Suspense>
  );
}

function Connexion() {
  const params = useSearchParams();
  const suite = params.get("suite") ?? "/projets";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const redirect = `${window.location.origin}/auth/callback?suite=${encodeURIComponent(suite)}`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
    if (error) {
      setError(error.message);
      setState("error");
    } else {
      setState("sent");
    }
  }

  return (
    <div className="page" style={{ maxWidth: 460, paddingTop: 40 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--encre)" }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--violet)" }} />
        <strong>Studio Voix</strong>
      </Link>
      <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Se connecter</h1>
        {state === "sent" ? (
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Un lien de connexion a été envoyé à <strong>{email}</strong>. Ouvrez-le sur cet appareil.
          </p>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label htmlFor="email" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>
              Votre adresse e-mail
            </label>
            <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
            <button className="btn btn-violet" disabled={state === "sending"}>
              {state === "sending" ? "Envoi…" : "Recevoir un lien de connexion"}
            </button>
            {state === "error" && <p className="error" style={{ margin: 0 }}>{error}</p>}
          </form>
        )}
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Pas de mot de passe : un compte est créé automatiquement à la première connexion. Offre gratuite : 3 minutes d&apos;enregistrement.
        </p>
      </div>
    </div>
  );
}
