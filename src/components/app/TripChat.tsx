"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, Bot, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripChatMessageRow } from "@/types/database";

interface Props {
  tripId: string;
  onChanged?: () => void;
}

interface ApiOk<T> { ok: true; data: T }
interface ApiErr { ok: false; error: string }

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  const json = (await res.json()) as ApiOk<T> | ApiErr;
  return json.ok ? json.data : null;
}

export function TripChat({ tripId, onChanged }: Props) {
  const [messages, setMessages] = React.useState<TripChatMessageRow[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const data = await getJson<{ messages: TripChatMessageRow[] }>(
      `/api/ai/chat-plan?trip_id=${tripId}`
    );
    if (data) setMessages(data.messages);
    setLoading(false);
  }, [tripId]);

  React.useEffect(() => { void load(); }, [load]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const send = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setSending(true);

      const optimistic: TripChatMessageRow = {
        id: `tmp-${Date.now()}`,
        trip_id: tripId,
        user_id: null,
        role: "user",
        content: trimmed,
        quick_replies: null,
        tool_summary: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setInput("");

      const res = await fetch("/api/ai/chat-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_id: tripId, message: trimmed }),
      });
      const json = (await res.json()) as ApiOk<{ message: TripChatMessageRow; changed: boolean }> | ApiErr;
      setSending(false);

      if (!json.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            trip_id: tripId,
            user_id: null,
            role: "assistant",
            content: `Something went wrong: ${json.error}`,
            quick_replies: null,
            tool_summary: null,
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      setMessages((prev) => [...prev, json.data.message]);
      if (json.data.changed) onChanged?.();
      inputRef.current?.focus();
    },
    [sending, tripId, onChanged]
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send(input);
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const quickReplies = (!sending && lastAssistant?.quick_replies) || [];

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-surface/40 overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan" />
        <div className="text-[13px] font-medium">Plan with AI</div>
        <div className="ml-auto text-[11px] text-faint">Ask, refine, ship</div>
      </div>

      <div
        ref={scrollRef}
        className="px-4 py-4 space-y-3 overflow-y-auto"
        style={{ maxHeight: 440, minHeight: 220 }}
      >
        {loading ? (
          <div className="text-[12px] text-faint">Loading conversation…</div>
        ) : messages.length === 0 ? (
          <div className="text-[12.5px] text-muted">
            Hi! Tell me what you&apos;d like to tweak — e.g. <span className="text-fg/80">&ldquo;Make day 2 more chill&rdquo;</span> or <span className="text-fg/80">&ldquo;Add a sunset spot on the last day&rdquo;</span>.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble key={m.id} m={m} />
            ))}
          </AnimatePresence>
        )}
        {sending && (
          <div className="flex items-center gap-2 text-[12px] text-faint">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      {quickReplies.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {quickReplies.map((q) => (
            <button
              key={q}
              onClick={() => void send(q)}
              disabled={sending}
              className="rounded-full border border-cyan/30 bg-cyan/[0.06] px-3 py-1 text-[12px] text-cyan hover:bg-cyan/[0.12] transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="border-t border-white/[0.06] p-3 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask the planner to add, change, or remove stops…"
          rows={1}
          disabled={sending}
          className="flex-1 resize-none rounded-xl bg-ink/40 border border-white/[0.08] px-3 py-2 text-[13px] text-fg placeholder:text-faint focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send"
          className="grid place-items-center w-9 h-9 rounded-xl bg-cyan text-bg hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ m }: { m: TripChatMessageRow }) {
  const isUser = m.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full grid place-items-center bg-cyan/15 text-cyan">
          <Bot className="w-3.5 h-3.5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug",
          isUser
            ? "bg-cyan text-bg rounded-br-md"
            : "bg-white/[0.05] text-fg border border-white/[0.07] rounded-bl-md"
        )}
      >
        <div className="whitespace-pre-wrap">{m.content}</div>
        {m.tool_summary && (
          <div className="mt-1.5 text-[11px] opacity-70">
            {summaryLine(m.tool_summary)}
          </div>
        )}
      </div>
      {isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full grid place-items-center bg-white/10 text-fg/80">
          <UserIcon className="w-3.5 h-3.5" />
        </div>
      )}
    </motion.div>
  );
}

function summaryLine(s: TripChatMessageRow["tool_summary"]): string {
  if (!s) return "";
  const bits: string[] = [];
  if (s.added) bits.push(`+${s.added} added`);
  if (s.updated) bits.push(`${s.updated} updated`);
  if (s.deleted) bits.push(`-${s.deleted} removed`);
  return bits.join(" · ");
}
