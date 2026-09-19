import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

// Image affichée quand le lien est partagé sur WhatsApp, Facebook, LinkedIn, X…
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE.title;

// Barres de la forme d'onde : hauteurs figées pour que l'image soit identique à chaque build.
const BARS = Array.from({ length: 36 }, (_, i) => 24 + ((i * 37) % 118));

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px 80px",
          background: "linear-gradient(135deg, #1b1722 0%, #2d1f5c 55%, #4b29cc 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#9e83ff,#5d37ee)" }} />
          <div style={{ fontSize: 30, fontWeight: 700 }}>{SITE.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.04, letterSpacing: -3 }}>
            La voix reste. Le bruit s’efface.
          </div>
          <div style={{ fontSize: 31, color: "#c9bfe6", maxWidth: 900, lineHeight: 1.4 }}>
            Enregistrez, nettoyez le bruit de fond, éditez votre audio comme un texte.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, height: 142 }}>
            {BARS.map((h, i) => (
              <div key={i} style={{ width: 7, height: h, borderRadius: 8, background: i < 18 ? "#6e6880" : "#a98dff" }} />
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#c9bfe6", whiteSpace: "nowrap" }}>
            3 minutes offertes · sans installation
          </div>
        </div>
      </div>
    ),
    size,
  );
}
