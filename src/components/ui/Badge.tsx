import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeAccent =
  | "cyan"
  | "sunset"
  | "gold"
  | "emerald"
  | "violet"
  | "rose"
  | "neutral";

const accentMap: Record<BadgeAccent, string> = {
  cyan: "bg-cyan/10 text-cyan border-cyan/30",
  sunset: "bg-sunset/10 text-sunset border-sunset/30",
  gold: "bg-gold/10 text-gold border-gold/30",
  emerald: "bg-emerald/10 text-emerald border-emerald/30",
  violet: "bg-violet/10 text-violet border-violet/30",
  rose: "bg-rose/10 text-rose border-rose/30",
  neutral: "bg-white/[0.06] text-muted border-white/10",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  accent?: BadgeAccent;
  size?: "sm" | "md";
}

export function Badge({
  className,
  accent = "neutral",
  size = "sm",
  ...rest
}: BadgeProps) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        accentMap[accent],
        className
      )}
    />
  );
}
