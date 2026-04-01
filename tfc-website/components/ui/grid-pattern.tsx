"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface GridPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: string | number;
  numSquares?: number;
  className?: string;
  maxOpacity?: number;
  duration?: number;
}

export function GridPattern({
  width = 60,
  height = 60,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  ...props
}: GridPatternProps) {
  const id = useRef(`grid-${Math.random().toString(36).slice(2, 9)}`).current;
  const containerRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [squares, setSquares] = useState<Array<[number, number, number]>>([]);

  const getPos = useCallback(() => {
    return [
      Math.floor((Math.random() * dimensions.width) / width),
      Math.floor((Math.random() * dimensions.height) / height),
      Math.random() * maxOpacity,
    ] as [number, number, number];
  }, [dimensions.width, dimensions.height, width, height, maxOpacity]);

  const generateSquares = useCallback(
    (count: number) => Array.from({ length: count }, () => getPos()),
    [getPos]
  );

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (dimensions.width && dimensions.height) {
      setSquares(generateSquares(numSquares));
    }
  }, [dimensions, generateSquares, numSquares]);

  const updateSquareAnimation = useCallback(
    (index: number) => {
      setSquares((prev) => {
        const next = [...prev];
        next[index] = getPos();
        return next;
      });
    },
    [getPos]
  );

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-warm-400/30 stroke-warm-400/30",
        className
      )}
      {...props}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map(([sqX, sqY, opacity], i) => (
          <motion.rect
            key={`${sqX}-${sqY}-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity }}
            transition={{
              duration,
              repeat: 1,
              delay: Math.random() * duration,
              repeatType: "reverse",
            }}
            onAnimationComplete={() => updateSquareAnimation(i)}
            width={width - 1}
            height={height - 1}
            x={sqX * width + 1}
            y={sqY * height + 1}
            fill="currentColor"
            strokeWidth="0"
          />
        ))}
      </svg>
    </svg>
  );
}

interface InfiniteGridHeroProps {
  children: React.ReactNode;
  className?: string;
}

export function InfiniteGridHero({ children, className }: InfiniteGridHeroProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  return (
    <div
      className={cn(
        "group/grid relative overflow-hidden bg-white",
        className
      )}
      onMouseMove={handleMouseMove}
    >
      {/* Base grid — always visible, subtle */}
      <div className="absolute inset-0">
        <GridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={6}
          className="[mask-image:radial-gradient(600px_circle_at_center,white,transparent)] fill-red/5 stroke-red/8"
        />
      </div>

      {/* Active grid — follows mouse cursor, brighter */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/grid:opacity-100">
        <HoverGrid mouseX={mouseX} mouseY={mouseY} />
      </div>

      {/* Red accent orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-red/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-red/[0.04] blur-3xl" />

      {/* Content */}
      {children}
    </div>
  );
}

function HoverGrid({
  mouseX,
  mouseY,
}: {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const maskImage = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, white, transparent)`;

  return (
    <motion.div className="absolute inset-0" style={{ maskImage, WebkitMaskImage: maskImage }}>
      <GridPattern
        numSquares={30}
        maxOpacity={0.3}
        duration={4}
        className="fill-red/20 stroke-red/20"
      />
    </motion.div>
  );
}
