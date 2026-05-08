"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * MagneticButton — subtle cursor-follow effect for primary CTAs.
 * Wraps an <a> for navigation. Becomes a no-op for users who prefer
 * reduced motion. Pointer-only (no touch).
 */
export function MagneticButton({
  href,
  children,
  className,
  strength = 0.18,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  strength?: number;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  const ref = React.useRef<HTMLAnchorElement | null>(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const reduce = useReducedMotion();

  function handleMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setPos({ x: x * strength, y: y * strength });
  }
  function handleLeave() {
    setPos({ x: 0, y: 0 });
  }

  return (
    <motion.a
      ref={ref}
      href={href}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 280, damping: 22, mass: 0.7 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap overflow-hidden",
        "h-12 px-6 text-[15px] font-semibold text-bg",
        "bg-gradient-to-b from-cyan to-cyan-soft",
        "shadow-[0_8px_30px_-8px_rgba(56,225,255,0.6)]",
        "hover:shadow-[0_18px_50px_-10px_rgba(56,225,255,0.9)]",
        "transition-shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className
      )}
    >
      {/* shimmer sheen */}
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full opacity-0 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.45) 45%, transparent 60%)",
        }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.a>
  );
}
