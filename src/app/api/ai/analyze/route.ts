import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const GROQ_MODEL = "llama-3.1-8b-instant"; // ✅ safe + fast

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json({
        content: "❌ GROQ_API_KEY missing in .env.local",
      });
    }

    const { messages, trade } = await req.json();

    if (!trade) {
      return NextResponse.json({
        content: "❌ No trade data received",
      });
    }

    const SYSTEM_PROMPT = `
You are a strict professional trading coach.

IMPORTANT RULES:
- If trade data is inconsistent (e.g. WIN but negative P&L), point it out clearly
- Do NOT blindly trust labels — verify with numbers
- Focus on risk management, execution discipline, and logic
- Call out serious mistakes directly (no sugarcoating)
- Keep response under 150 words, clear and actionable
`;

const groqMessages = [
  { role: "system", content: SYSTEM_PROMPT }, // 🔥 ADD THIS LINE
  ...messages // your existing messages from frontend
];

    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: groqMessages,
          temperature: 0.7,
        }),
      }
    );

    // 🔥 SHOW REAL ERROR
    if (!res.ok) {
      const err = await res.text();
      console.error("Groq error:", err);

      return NextResponse.json({
        content: `❌ Groq error: ${err}`,
      });
    }

    const data = await res.json();

    const reply =
      data.choices?.[0]?.message?.content?.trim() ?? "No response";

    return NextResponse.json({ content: reply });

  } catch (err) {
    console.error("AI ERROR:", err);

    return NextResponse.json({
      content: "❌ Server error while analyzing trade",
    });
  }
}