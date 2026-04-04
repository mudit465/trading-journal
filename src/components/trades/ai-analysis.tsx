"use client";

import { useState } from "react";
import { Bot, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Trade } from "@/types";
import { cn } from "@/lib/utils";

type AiAnalysisProps = {
  trade: Trade;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AiAnalysis({ trade }: AiAnalysisProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function analyzeInitial() {
    setExpanded(true);
    setLoading(true);

    const context = buildTradeContext(trade);
    const userMsg: Message = {
      role: "user",
      content: `Please analyze this trade and tell me what mistakes I made, what I did well, and how I can improve:\n\n${context}`,
    };

    setMessages([userMsg]);

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [userMsg] }),
      });

      const data = await res.json();
      setMessages([userMsg, { role: "assistant", content: data.content }]);
    } catch {
      setMessages([userMsg, { role: "assistant", content: "Failed to get AI analysis. Please check your OpenAI API key." }]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-200">AI Trade Analysis</p>
            <p className="text-xs text-zinc-500">Ask AI what mistakes you made</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-zinc-800">
          {messages.length === 0 ? (
            <div className="p-5 text-center">
              <p className="text-sm text-zinc-500 mb-4">
                Let AI analyze your trade, spot mistakes, and give actionable feedback.
              </p>
              <Button variant="primary" onClick={analyzeInitial} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Analyze this trade
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-zinc-800 text-zinc-300 ml-6"
                      : "bg-indigo-500/5 border border-indigo-500/15 text-zinc-300 mr-6"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Bot className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-xs font-medium text-indigo-400">AI Analysis</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              ))}
              {loading && (
                <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-lg px-4 py-3 mr-6">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                </div>
              )}
            </div>
          )}

          {/* Input */}
          {messages.length > 0 && (
            <div className="p-3 border-t border-zinc-800 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask a follow-up question..."
                className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600"
                disabled={loading}
              />
              <Button variant="primary" size="sm" onClick={sendMessage} disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function buildTradeContext(trade: Trade): string {
  return `
Trade Details:
- Instrument: ${trade.instrument}
- Date: ${trade.date}
- Direction: ${trade.direction}
- Status: ${trade.status}
- Session: ${trade.session ?? "Not specified"}
- Entry time: ${trade.entry_time ?? "Not specified"}
- Exit time: ${trade.exit_time ?? "Not specified"}

Risk Management:
- Risk amount: $${trade.risk_amount}
- RR Ratio: ${trade.rr_ratio}R
- SL: ${trade.sl_pips} pips
- TP: ${trade.tp_pips} pips
- P&L: $${trade.profit_loss}

Concepts used: ${trade.concepts?.join(", ") || "None"}

TP Levels:
${
  trade.tp_levels?.map((tp) =>
    `  TP${tp.level}: ${tp.pips} pips${tp.price ? ` @ ${tp.price}` : ""} - ${tp.hit ? "HIT" : "NOT HIT"}`
  ).join("\n") ?? "None"
}

Notes: ${trade.notes ?? "No notes"}
  `.trim();
}
