import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert trading coach and journal analyst. You help traders identify mistakes, patterns, and areas for improvement in their trades.

When analyzing a trade, provide:
1. What was done well
2. Key mistakes identified  
3. Risk management assessment
4. Actionable improvements for next time
5. Pattern observations

Be concise, specific, and constructive. Use bullet points for clarity. Don't be harsh — focus on growth.`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key") {
      return NextResponse.json({
        content: "AI analysis is not configured. Please add your OPENAI_API_KEY to the .env.local file to enable this feature.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    return NextResponse.json({
      content: completion.choices[0].message.content ?? "No response generated.",
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { content: "Failed to generate analysis. Please try again." },
      { status: 500 }
    );
  }
}
