"use client";

export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-[800] shrink-0"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #E02020, #8A1010)",
        fontSize: Math.round(size * 0.4),
      }}
    >
      {name?.charAt(0)?.toUpperCase()}
    </div>
  );
}
