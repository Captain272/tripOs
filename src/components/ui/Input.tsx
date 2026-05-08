import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={cn(
      "w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-4 text-sm text-fg placeholder:text-faint",
      "focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan/40 transition-colors",
      className
    )}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    {...props}
    className={cn(
      "w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-fg placeholder:text-faint",
      "focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan/40 transition-colors min-h-[100px] resize-none",
      className
    )}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    {...props}
    className={cn(
      "w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-4 text-sm text-fg appearance-none",
      "focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan/40 transition-colors",
      // Custom chevron via background-image
      "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22none%22 stroke=%22%239aa3b8%22 stroke-width=%221.5%22><polyline points=%225 8 10 13 15 8%22/></svg>')] bg-no-repeat bg-[length:18px_18px] bg-[right_0.75rem_center] pr-10",
      className
    )}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    {...props}
    className={cn(
      "block text-xs font-medium text-muted uppercase tracking-wider mb-1.5",
      className
    )}
  />
));
Label.displayName = "Label";
