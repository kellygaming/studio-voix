import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Jeton à usage unique pour ElevenLabs Scribe Realtime : la clé API ne quitte jamais le serveur.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const res = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" },
  });
  if (!res.ok) return NextResponse.json({ error: "jeton indisponible" }, { status: 502 });
  const { token } = (await res.json()) as { token: string };
  return NextResponse.json({ token });
}
