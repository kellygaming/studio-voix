"use client";

// Transcription en direct via ElevenLabs Scribe v2 Realtime (WebSocket).
// Affichage uniquement : la version finale (minutage par mot) est refaite en batch par le worker
// sur l'audio débruité. Toute erreur ici est non bloquante pour l'enregistrement.

export type LiveCallbacks = {
  onPartial: (text: string) => void;
  onCommitted: (text: string) => void;
  onError?: (message: string) => void;
};

const WS_URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime";

export async function startLiveTranscription(ctx: AudioContext, source: MediaStreamAudioSourceNode, cb: LiveCallbacks) {
  const tokenRes = await fetch("/api/scribe-token", { method: "POST" });
  if (!tokenRes.ok) throw new Error("Transcription en direct indisponible");
  const { token } = (await tokenRes.json()) as { token: string };

  const params = new URLSearchParams({
    model_id: "scribe_v2_realtime",
    token,
    language_code: "fr",
    audio_format: "pcm_16000",
    commit_strategy: "vad",
  });
  const ws = new WebSocket(`${WS_URL}?${params}`);

  await ctx.audioWorklet.addModule("/pcm-worklet.js");
  const node = new AudioWorkletNode(ctx, "pcm-downsampler");
  source.connect(node);
  // Certains navigateurs ne font tourner le worklet que s'il est relié à la sortie : gain nul = silence.
  const mute = ctx.createGain();
  mute.gain.value = 0;
  node.connect(mute).connect(ctx.destination);

  node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        message_type: "input_audio_chunk",
        audio_base_64: arrayBufferToBase64(e.data),
        commit: false,
        sample_rate: 16000,
      }),
    );
  };

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data as string) as { message_type?: string; text?: string; error?: string };
      if (msg.message_type === "partial_transcript") cb.onPartial(msg.text ?? "");
      else if (msg.message_type === "committed_transcript") cb.onCommitted(msg.text ?? "");
      else if (msg.message_type?.includes("error")) cb.onError?.(msg.error ?? msg.message_type);
    } catch {
      /* message non JSON ignoré */
    }
  };
  ws.onerror = () => cb.onError?.("Connexion à la transcription perdue");

  return () => {
    node.port.onmessage = null;
    try {
      source.disconnect(node);
    } catch {
      /* déjà déconnecté */
    }
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message_type: "input_audio_chunk", audio_base_64: "", commit: true, sample_rate: 16000 }));
      setTimeout(() => ws.close(), 1500);
    } else {
      ws.close();
    }
  };
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
