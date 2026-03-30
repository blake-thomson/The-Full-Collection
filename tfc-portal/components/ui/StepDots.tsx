"use client";

interface StepDotsProps {
  current: number;
  total: number;
}

export function StepDots({ current, total }: StepDotsProps) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: i <= current ? "var(--color-red)" : "#252525",
            opacity: i < current ? 0.5 : 1,
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}
