"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin top-of-page progress bar tied to overall scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const w = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 24,
    restDelta: 0.001,
  });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX: w, transformOrigin: "0% 50%" }}
      className="fixed top-0 inset-x-0 z-[60] h-[2px] bg-gradient-to-r from-cyan via-violet to-sunset"
    />
  );
}
