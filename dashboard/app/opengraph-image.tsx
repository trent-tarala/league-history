import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt = "Venice Idiots — Fantasy Football League History";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#0b1220",
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(124, 92, 255, 0.4), transparent 55%), radial-gradient(circle at 100% 100%, rgba(76, 201, 240, 0.22), transparent 50%)",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #f5c451, #7c5cff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
            }}
          >
            🏆
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: "#9aa6c7",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Fantasy Football
          </div>
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: "#e6ecff",
            letterSpacing: -3,
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          Venice Idiots
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#f5c451",
            fontWeight: 600,
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          League history, records, rivalries &amp; eternal shame
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 10,
            background: "linear-gradient(90deg, #7c5cff, #4cc9f0, #f5c451, #3ddc84)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
