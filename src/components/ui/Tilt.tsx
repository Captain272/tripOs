"use client";

import * as React from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Tilt — mouse-tracked 3D tilt. Pointer-only. Pads its child with perspective.
 * Use sparingly (heroes, big product cards). Reduced-motion safe.
 */
export function Tilt({
  children,
  className,
  max = 6, // max tilt degrees
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  const x = useSpring(0, { stiffness: 120, damping: 18, mass: 0.6 });
  const y = useSpring(0, { stiffness: 120, damping: 18, mass: 0.6 });
  const rotateX = useTransform(y, [-1, 1], [max, -max]);
  const rotateY = useTransform(x, [-1, 1], [-max, max]);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px * 2);
    y.set(py * 2);
  }
  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ perspective: 1200 }}
      className={cn("group", className)}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}
