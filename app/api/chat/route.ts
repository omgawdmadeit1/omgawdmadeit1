import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const last = messages[messages.length - 1]?.content || "";
  return NextResponse.json({ reply: `CFO take: ${last.includes("cash") ? "cut discretionary software spend by 12% and accelerate receivables." : "focus on margin expansion and collection speed."}` });
}
