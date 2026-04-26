import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateAIInsights(summary: string): Promise<string[]> {
  try {
    const prompt = `
You are a trading coach.

${summary}

Give exactly 3 bullet points:
- Start with "•"
- Max 15 words
- No extra text
`;

    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.choices[0]?.message?.content || "";

    return text
      .split("\n")
      .filter((l) => l.startsWith("•"))
      .map((l) => l.replace("•", "").trim())
      .slice(0, 3);

  } catch (err) {
    console.error("[AI ERROR]", err);
    return [
      "Focus on improving risk management.",
      "Avoid overtrading after losses.",
      "Maintain consistent position sizing.",
    ];
  }
}