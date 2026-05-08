import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  /** Adds vertical padding. Defaults to xl. */
  spacing?: "md" | "lg" | "xl";
}

/** Standard section wrapper — controls vertical rhythm and max width. */
export function Section({
  className,
  spacing = "xl",
  id,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      {...rest}
      className={cn(
        "relative",
        spacing === "md" && "py-16 sm:py-20",
        spacing === "lg" && "py-20 sm:py-28",
        spacing === "xl" && "py-24 sm:py-32",
        className
      )}
    >
      {children}
    </section>
  );
}

/** 12-col container, capped at ~1200px. */
export function Container({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn("mx-auto w-full max-w-[1200px] px-5 sm:px-8", className)}
    />
  );
}

/** Eyebrow / kicker label used above section headings. */
export function Eyebrow({
  className,
  children,
  accent = "cyan",
}: {
  className?: string;
  children: React.ReactNode;
  accent?: "cyan" | "sunset" | "gold" | "emerald";
}) {
  const colorMap = {
    cyan: "text-cyan",
    sunset: "text-sunset",
    gold: "text-gold",
    emerald: "text-emerald",
  } as const;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-medium",
        colorMap[accent],
        className
      )}
    >
      <span className="h-px w-6 bg-current opacity-50" />
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  eyebrowAccent = "cyan",
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  eyebrowAccent?: "cyan" | "sunset" | "gold" | "emerald";
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <Eyebrow accent={eyebrowAccent} className="mb-4">
          {eyebrow}
        </Eyebrow>
      )}
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base sm:text-lg text-muted leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
