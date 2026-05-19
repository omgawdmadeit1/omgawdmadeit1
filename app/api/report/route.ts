import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ weekly: "Revenue up 14%, expenses flat, runway stable.", monthly: "Positive cash trajectory with room to optimize marketing mix." });
}
