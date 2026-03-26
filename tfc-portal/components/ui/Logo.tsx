"use client";

export function Logo({ size = 16, sub = "Client Portal" }: { size?: number; sub?: string }) {
  return (
    <div className="text-center">
      <div
        className="font-heading font-[800] tracking-[0.28em] uppercase"
        style={{ color: "#E02020", fontSize: size }}
      >
        THE FULL COLLECTION
      </div>
      <div className="text-text-3 text-[10px] tracking-[0.2em] uppercase mt-[5px]">{sub}</div>
    </div>
  );
}
