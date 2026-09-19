import { ImageResponse } from "next/og";

// `apple-icon` n'accepte pas le SVG : l'icône iOS est rendue en PNG au build.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BARS = [22, 66, 106, 50, 16];

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 11,
          background: "linear-gradient(135deg, #8b6cff, #5733e8)",
        }}
      >
        {BARS.map((h, i) => (
          <div key={i} style={{ width: 14, height: h, borderRadius: 7, background: "#fff" }} />
        ))}
      </div>
    ),
    size,
  );
}
