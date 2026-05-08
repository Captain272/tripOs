"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

interface CountUpProps {
  /** Target number to count up to. */
  to: number;
  /** Duration in ms. Default 1100. */
  duration?: number;
  /** Optional formatter (e.g. inr, pct). Defaults to en-IN locale. */
  format?: (n: number) => string;
  /** Prefix / suffix strings. */
  prefix?: string;
  suffix?: string;
  className?: string;
}

/** Counts up to a number when scrolled into view. Honors prefers-reduced-motion. */
export function CountUp({
  to,
  duration = 1100,
  format,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, {
    stiffness: 80,
    damping: 22,
    mass: 1,
    duration: duration / 1000,
  });
  const [val, setVal] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(to);
      return;
    }
    mv.set(to);
  }, [inView, to, mv, reduce]);

  React.useEffect(() => {
    return spring.on("change", (v) => setVal(v));
  }, [spring]);

  const display = format
    ? format(Math.round(val))
    : Math.round(val).toLocaleString("en-IN");

  return (
    <motion.span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}
