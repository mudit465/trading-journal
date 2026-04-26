import { NextRequest, NextResponse } from "next/server";

// ── Swap this import to match your existing AI function ──────────────────
// import { generateAIInsights } from "@/lib/ai/groq";  // Groq version
// import { generateAIInsights } from "@/lib/ai/hf";    // HuggingFace version

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const GROQ_MODEL = "llama-3.1-8b-instant";

function buildPrompt(message: string, stats: Record<string, unknown>): string {
  return `You are an expert trading coach. A trader is asking you a question.
Here is their current trading performance:
- Win rate: ${stats.win_rate ?? "N/A"}%
- Average win: $${stats.avg_win ?? "N/A"}
- Average loss: $${stats.avg_loss ?? "N/A"}
- Expectancy: $${stats.expectancy ?? "N/A"} per trade
- Max drawdown: $${stats.max_drawdown ?? "N/A"}
- Max win streak: ${stats.max_win_streak ?? "N/A"}
- Max loss streak: ${stats.max_loss_streak ?? "N/A"}
- Total trades: ${stats.total_trades ?? "N/A"}

Trader's question: "${message}"

Respond as a direct, experienced trading coach. Be specific, use their numbers,
and give actionable advice. Keep your response under 150 words.
Do not use bullet points — respond in clear, flowing sentences.`;
}

export async function POST(req: NextRequest) {
  try {
    const { message, stats } = await req.json() as {
      message: string;
      stats: Record<string, unknown>;
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { reply: "Please ask a question." },
        { status: 400 }
      );
    }

    // ── No API key → graceful fallback ────────────────────────────────────
    if (!GROQ_API_KEY) {
      return NextResponse.json({
        reply: "AI coach is not configured. Add GROQ_API_KEY to .env.local.",
      });
    }

    const prompt = buildPrompt(message, stats ?? {});

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      throw new Error(`Groq error: ${groqRes.status}`);
    }

    const data = await groqRes.json() as {
      choices: { message: { content: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ reply: reply || "No response generated." });
  } catch (err) {
    console.error("AI chat error:", err);
    return NextResponse.json({
      reply: "I'm having trouble connecting right now. Please try again shortly.",
    });
  }
}