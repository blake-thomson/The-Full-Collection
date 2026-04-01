import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "The Full Collection — Nashville Content Production Agency";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1A1917",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Red accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "6px",
            height: "100%",
            background: "#E02020",
          }}
        />

        {/* Label */}
        <div
          style={{
            color: "#E02020",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontFamily: "sans-serif",
            marginBottom: "24px",
          }}
        >
          Nashville, TN · Content Production Agency
        </div>

        {/* Main heading */}
        <div
          style={{
            color: "#FFFFFF",
            fontSize: "88px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 0.95,
            fontFamily: "sans-serif",
            marginBottom: "32px",
          }}
        >
          THE FULL
          <br />
          <span style={{ color: "#E02020" }}>COLLECTION</span>
        </div>

        {/* Sub */}
        <div
          style={{
            color: "#A8A49C",
            fontSize: "24px",
            fontFamily: "sans-serif",
            maxWidth: "700px",
            lineHeight: 1.4,
          }}
        >
          Full-stack videography, photography, editing &amp; social media management — powered by a proprietary client portal.
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "80px",
            color: "#5A5652",
            fontSize: "16px",
            fontFamily: "sans-serif",
            letterSpacing: "0.06em",
          }}
        >
          thefullcollection.com
        </div>
      </div>
    ),
    { ...size }
  );
}
