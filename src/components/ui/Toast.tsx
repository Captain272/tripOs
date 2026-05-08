"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export type ToastMessage = { id: number; title: string; body?: string };

const ToastCtx = React.createContext<{
  push: (msg: Omit<ToastMessage, "id">) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const push = React.useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...msg }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000
    );
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col gap-2 sm:max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="pointer-events-auto glass-strong rounded-2xl px-4 py-3 flex items-start gap-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
            >
              <span className="mt-0.5 grid place-items-center w-7 h-7 rounded-full bg-emerald/15 text-emerald">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-fg">{t.title}</div>
                {t.body && (
                  <div className="text-xs text-muted mt-0.5">{t.body}</div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) {
    return {
      push: (msg: Omit<ToastMessage, "id">) => {
        if (typeof window !== "undefined") console.log("[toast]", msg);
      },
    };
  }
  return ctx;
}
