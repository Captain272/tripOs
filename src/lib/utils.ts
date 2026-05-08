import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** cn — merge Tailwind classes safely, dedupe conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format INR with thousands separators (Indian numbering) */
export function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

/** Compact integer formatter (e.g. 1240 -> 1,240) */
export function num(n: number) {
  return n.toLocaleString("en-IN");
}
