"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Loader2, Sparkles, ChevronDown, ChevronUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Trade } from "@/types";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

// ── Lightweight markdown renderer (no external deps) ──────────────────────
// Handles: **bold**, *italic*, # headings, - lists, 1. ordered lists,
// `code`, horizontal rules, and line breaks

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  function inlineFormat(text: string): React.ReactNode[] {
    // Split on **bold**, *italic*, `code`
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, pi) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={pi} className="font-semibold text-zinc-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <em key={pi} className="italic text-zinc-400">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={pi} className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  }

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1.5" />);
      i++;
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <p key={key++} className="text-sm font-semibold text-zinc-200 mt-3 mb-1 first:mt-0">
          {inlineFormat(line.slice(4))}
        </p>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <p key={key++} className="text-sm font-semibold text-zinc-100 mt-3 mb-1 first:mt-0">
          {inlineFormat(line.slice(3))}
        </p>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <p key={key++} className="text-base font-semibold text-zinc-100 mt-3 mb-1 first:mt-0">
          {inlineFormat(line.slice(2))}
        </p>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      elements.push(<hr key={key++} className="border-zinc-700 my-2" />);
      i++;
      continue;
    }

    // Unordered list — collect consecutive list items
    if (line.match(/^[-*+] /)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*+] /)) {
        items.push(
          <li key={i} className="text-zinc-300">
            {inlineFormat(lines[i].slice(2))}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-0.5 my-1 pl-1 text-sm">
          {items}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        const text = lines[i].replace(/^\d+\. /, "");
        items.push(
          <li key={i} className="text-zinc-300">
            {inlineFormat(text)}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={key++} className="list-decimal list-inside space-y-0.5 my-1 pl-1 text-sm">
          {items}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={key++} className="border-l-2 border-indigo-500 pl-3 text-zinc-400 italic text-sm my-1">
          {inlineFormat(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="text-sm text-zinc-300 leading-relaxed">
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ── Main component ────────────────────────────────────────────────────────

export function AiAnalysis({ trade }: { trade: Trade }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function callApi(msgs: Message[]): Promise<string> {
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, trade }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const reply = data.content ?? data.analysis ?? "";
    if (!reply) throw new Error("Empty response");
    return reply;
  }

  async function analyzeInitial() {
    setExpanded(true);
    setLoading(true);
    const firstMsg: Message = {
      role: "user",
      content: `Analyze this trade. What mistakes did I make, what did I do well, and how can I improve?\n\n${buildContext(trade)}`,
    };
    setMessages([firstMsg]);
    try {
      const reply = await callApi([firstMsg]);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Failed to get analysis. Check your API key." }]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const userMsg: Message = { role: "user", content: trimmed };
    const snapshot = [...messages, userMsg];
    setMessages(snapshot);
    setInput("");
    setLoading(true);
    try {
      const reply = await callApi(snapshot);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "What should my SL have been?",
    "Was my R:R good?",
    "How can I improve my entry?",
    "What does this say about my psychology?",
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-200">AI Trade Coach</p>
            <p className="text-xs text-zinc-500">Get personalized feedback on this trade</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
      </button>

      {expanded && (
        <div className="border-t border-zinc-800">

          {/* Empty state */}
          {messages.length === 0 && !loading && (
            <div className="p-6 text-center space-y-3">
              <p className="text-sm text-zinc-500">
                AI will analyze your entry, exit, risk management, and mindset.
              </p>
              <Button onClick={analyzeInitial}>
                <Sparkles className="h-4 w-4" />
                Analyze this trade
              </Button>
            </div>
          )}

          {/* Messages */}
          {(messages.length > 0 || loading) && (
            <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={cn(msg.role === "user" && "flex justify-end")}>
                  {msg.role === "user" ? (
                    <div className="bg-zinc-800 rounded-xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-sm text-zinc-300">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Bot className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-xs font-medium text-indigo-400">AI Coach</span>
                      </div>
                      {/* Proper markdown rendering */}
                      <MarkdownContent content={msg.content} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Bot className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-xs font-medium text-indigo-400">AI Coach</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}

          {/* Suggestion chips after first response */}
          {messages.length === 2 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-zinc-800 text-zinc-500 hover:border-indigo-500/30 hover:text-indigo-400 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          {messages.length > 0 && (
            <div className="p-3 border-t border-zinc-800 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask a follow-up question…"
                disabled={loading}
                className="flex-1 bg-zinc-800/80 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
              />
              <Button size="sm" onClick={sendMessage} disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function buildContext(trade: Trade): string {
  return `Instrument: ${trade.instrument}
Direction: ${trade.direction}
Result: ${trade.status}
Entry time: ${trade.entry_time ?? "N/A"}
Exit time: ${trade.exit_time ?? "N/A"}
Risk: $${trade.risk_amount}
RR: ${trade.rr_ratio}R
P&L: $${trade.profit_loss}
SL: ${trade.sl_pips} pips
TP: ${trade.tp_pips} pips
Session: ${trade.session ?? "N/A"}
Concepts: ${trade.concepts?.join(", ") || "None"}
TP Levels: ${trade.tp_levels?.map((tp) => `TP${tp.level}: ${tp.pips}pips${tp.price ? ` @ ${tp.price}` : ""} — ${tp.hit ? "HIT" : "MISSED"}`).join(", ") ?? "None"}
Notes: ${trade.notes ?? "None"}`.trim();
}
