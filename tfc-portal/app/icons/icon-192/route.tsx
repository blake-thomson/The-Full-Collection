import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          borderRadius: 38,
          background: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#E02020",
            fontSize: 68,
            fontWeight: 800,
            letterSpacing: "2px",
            lineHeight: 1,
          }}
        >
          TFC
        </span>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
