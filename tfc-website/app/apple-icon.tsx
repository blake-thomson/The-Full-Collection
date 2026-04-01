import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#E02020",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "36px",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "72px",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          TFC
        </div>
      </div>
    ),
    { ...size }
  );
}
