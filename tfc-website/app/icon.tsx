import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "6px",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "13px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
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
