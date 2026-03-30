import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#E02020",
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "2px",
            lineHeight: 1,
          }}
        >
          TFC
        </span>
      </div>
    ),
    { ...size }
  );
}
