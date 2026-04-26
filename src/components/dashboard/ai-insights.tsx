"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Bot, Send, Loader2, RefreshCw, User } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Stats = {
  win_rate?: number;
  avg_win?: number;
  avg_loss?: number;
  expectancy?: number;
  max_drawdown?: number;
  max_win_streak?: number;
  max_loss_streak?: number;
  total_trades?: number;
};

type Props = {
  initialInsight: string;   // your existing AI insight string
  stats: Stats;
};

// ── Suggestion chips ───────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Why am I losing money?",
  "How can I improve my win rate?",
  "Is my risk management good?",
  "What's my biggest weakness?",
];

// ── Component ──────────────────────────────────────────────────────────────

export function AIInsights({ initialInsight, stats }: Props) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, stats }),
        });

        const data = await res.json() as { reply: string };
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Something went wrong. Please try again.",
          },
        ]);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800">
        <div className="h-7 w-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20
                        flex items-center justify-center shrink-0">
          <Bot className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-200">AI Trading Coach</p>
          <p className="text-xs text-zinc-500">Ask anything about your performance</p>
        </div>
      </div>

      {/* ── Existing insight (always visible) ───────────────────────────── */}
      <div className="px-5 py-4 border-b border-zinc-800/60">
        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-medium">
          Today's insight
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {initialInsight || "Log some trades to get personalized insights."}
        </p>
      </div>

      {/* ── Chat messages ────────────────────────────────────────────────── */}
      {messages.length > 0 && (
        <div className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2.5 items-start",
                msg.role === "user" && "flex-row-reverse"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "h-6 w-6 rounded-full shrink-0 flex items-center justify-center mt-0.5",
                msg.role === "assistant"
                  ? "bg-indigo-500/15 border border-indigo-500/20"
                  : "bg-zinc-700"
              )}>
                {msg.role === "assistant"
                  ? <Bot  className="h-3 w-3 text-indigo-400" />
                  : <User className="h-3 w-3 text-zinc-400" />
                }
              </div>

              {/* Bubble */}
              <div className={cn(
                "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%]",
                msg.role === "assistant"
                  ? "bg-zinc-800/80 text-zinc-300 rounded-tl-sm"
                  : "bg-indigo-500/15 border border-indigo-500/20 text-indigo-200 rounded-tr-sm"
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading bubble */}
          {isPending && (
            <div className="flex gap-2.5 items-start">
              <div className="h-6 w-6 rounded-full bg-indigo-500/15 border border-indigo-500/20
                              shrink-0 flex items-center justify-center mt-0.5">
                <Bot className="h-3 w-3 text-indigo-400" />
              </div>
              <div className="bg-zinc-800/80 rounded-xl rounded-tl-sm px-3.5 py-3">
                <div className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500
                                   animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500
                                   animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500
                                   animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Suggestion chips (only before first message) ─────────────────── */}
      {messages.length === 0 && (
        <div className="px-4 py-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-full border border-zinc-700
                         text-zinc-400 hover:border-indigo-500/40 hover:text-indigo-400
                         transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-2 flex gap-2 items-end border-t border-zinc-800/60">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your trading coach…"
          rows={1}
          disabled={isPending}
          className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-xl
                     px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600
                     outline-none focus:border-indigo-500/40 focus:ring-1
                     focus:ring-indigo-500/20 resize-none transition-colors
                     disabled:opacity-50 leading-relaxed"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isPending || !input.trim()}
          className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20
                     flex items-center justify-center text-indigo-400 shrink-0
                     hover:bg-indigo-500/25 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send    className="h-4 w-4" />
          }
        </button>
      </div>
    </div>
  );
}