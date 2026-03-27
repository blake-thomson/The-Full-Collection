"use client";

export function Avatar({ name, size = 30, src }: { name: string; size?: number; src?: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
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
