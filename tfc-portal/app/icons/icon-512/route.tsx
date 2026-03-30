import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 102,
          background: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#E02020",
            fontSize: 180,
            fontWeight: 800,
            letterSpacing: "6px",
            lineHeight: 1,
          }}
        >
          TFC
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
