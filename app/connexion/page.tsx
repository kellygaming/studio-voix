"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
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
  const lienInvalide = params.get("erreur") === "lien";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "google" | "error">("idle");
  const [error, setError] = useState("");

  const callbackUrl = () => `${window.location.origin}/auth/callback?suite=${encodeURIComponent(suite)}`;

  async function withGoogle() {
    setState("google");
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(), queryParams: { prompt: "select_account" } },
    });
    // En cas de succès, le navigateur part vers Google : on ne revient ici qu'en cas d'erreur.
    if (error) {
      setError(error.message);
      setState("error");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl() } });
    if (error) {
      setError(error.message);
      setState("error");
    } else {
      setState("sent");
    }
  }

  return (
    <div className="page" style={{ maxWidth: 460, paddingTop: 40 }}>
      <Logo />
      <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Se connecter</h1>

        {lienInvalide && state === "idle" && (
          <p className="error" style={{ margin: 0 }}>Ce lien de connexion a expiré ou n&apos;est plus valide. Réessayez.</p>
        )}

        {state === "sent" ? (
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Un lien de connexion a été envoyé à <strong>{email}</strong>. Ouvrez-le sur cet appareil.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={withGoogle}
              disabled={state === "google" || state === "sending"}
              className="btn btn-blanc"
              style={{ width: "100%", gap: 10 }}
            >
              <GoogleIcon />
              {state === "google" ? "Redirection…" : "Continuer avec Google"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="muted">
              <span style={{ flex: 1, height: 1, background: "var(--bord)" }} />
              <span style={{ fontSize: 13 }}>ou par e-mail</span>
              <span style={{ flex: 1, height: 1, background: "var(--bord)" }} />
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label htmlFor="email" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>
                Votre adresse e-mail
              </label>
              <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
              <button className="btn btn-violet" disabled={state === "sending" || state === "google"}>
                {state === "sending" ? "Envoi…" : "Recevoir un lien de connexion"}
              </button>
            </form>
          </>
        )}

        {state === "error" && <p className="error" style={{ margin: 0 }}>{error}</p>}

        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Pas de mot de passe : un compte est créé automatiquement à la première connexion. Offre gratuite : 3 minutes d&apos;enregistrement.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
