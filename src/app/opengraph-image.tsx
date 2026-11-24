import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Gancho — Roteiros prontos toda segunda-feira";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#17181a",
          color: "#ffffff",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, textTransform: "uppercase" }}>
          Gancho
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1.05, fontWeight: 700 }}>
          <span>Pare de olhar</span>
          <span>o feed.</span>
          <span style={{ color: "#e8472e" }}>Comece a gravar.</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#d9d4ca" }}>
          Roteiros completos toda segunda-feira
        </div>
      </div>
    ),
    size,
  );
}
