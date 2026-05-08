"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Marquee — pure-CSS infinite ticker. Items are duplicated once for a
 * seamless loop. Hover pauses. Honors reduced-motion via CSS media query.
 */
export function Marquee({
  children,
  speed = 36, // seconds per loop
  className,
  pauseOnHover = true,
  reverse = false,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  pauseOnHover?: boolean;
  reverse?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden",
        pauseOnHover && "[&:hover_.marquee-track]:[animation-play-state:paused]",
        "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className
      )}
    >
      <div
        className="marquee-track flex shrink-0 gap-3 pr-3 will-change-transform"
        style={{
          animation: `marquee-loop ${speed}s linear infinite ${
            reverse ? "reverse" : ""
          }`,
        }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="marquee-track flex shrink-0 gap-3 pr-3 will-change-transform"
        style={{
          animation: `marquee-loop ${speed}s linear infinite ${
            reverse ? "reverse" : ""
          }`,
        }}
      >
        {children}
      </div>

      <style jsx>{`
        @keyframes marquee-loop {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
