"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: false;
}

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

const variants: Record<Variant, string> = {
  primary:
    "relative text-bg font-semibold bg-gradient-to-b from-cyan to-cyan-soft hover:brightness-110 shadow-[0_8px_30px_-8px_rgba(56,225,255,0.6)] hover:shadow-[0_12px_40px_-8px_rgba(56,225,255,0.8)] transition-all",
  secondary:
    "bg-white text-bg font-semibold hover:bg-white/90 shadow-[0_8px_30px_-8px_rgba(255,255,255,0.4)] transition-colors",
  ghost:
    "bg-white/[0.04] text-fg border border-white/10 hover:bg-white/[0.08] backdrop-blur-md transition-colors",
  outline:
    "border border-white/15 text-fg hover:bg-white/[0.05] transition-colors",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        {...rest}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none",
          sizes[size],
          variants[variant],
          className
        )}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

/** Anchor-styled like a button — for navigation CTAs. */
export const ButtonLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    variant?: Variant;
    size?: Size;
  }
>(({ className, variant = "primary", size = "md", children, ...rest }, ref) => (
  <a
    ref={ref}
    {...rest}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      sizes[size],
      variants[variant],
      className
    )}
  >
    {children}
  </a>
));
ButtonLink.displayName = "ButtonLink";
