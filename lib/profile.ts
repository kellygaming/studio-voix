import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";

/** Utilisateur connecté + offre active (expirée = gratuit). Redirige vers /connexion sinon. */
export async function requireUser(next: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(next)}`);

  const { data: profile } = await supabase.from("profiles").select("plan, plan_expires_at").eq("id", user.id).single();
  const expired = profile?.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
  const plan = getPlan(expired ? "gratuit" : profile?.plan);
  return { supabase, user, plan };
}
