"use client";

import { cn } from "@/lib/utils";

interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
  children: React.ReactNode;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
  repeat = 4,
  children,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group/marquee flex [--duration:40s] [--gap:1rem]",
        vertical ? "flex-col overflow-hidden" : "flex-row overflow-x-clip",
        className
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 justify-around [gap:var(--gap)] [padding-inline-end:var(--gap)]",
            vertical ? "animate-marquee-vertical flex-col" : "animate-marquee",
            pauseOnHover && "group-hover/marquee:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]"
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
