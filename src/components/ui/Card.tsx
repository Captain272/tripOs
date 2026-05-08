import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn(
      "relative rounded-2xl border border-white/10 bg-surface/60 backdrop-blur-md",
      className
    )}
  />
));
Card.displayName = "Card";

export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn("glass rounded-2xl", className)}
  />
));
GlassCard.displayName = "GlassCard";
