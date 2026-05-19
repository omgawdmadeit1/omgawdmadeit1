import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { merchant } = await req.json();
  const map: Record<string, string> = { "aws": "Software", "google": "Marketing", "retainer": "Revenue" };
  const key = Object.keys(map).find((k) => merchant.toLowerCase().includes(k));
  return NextResponse.json({ category: key ? map[key] : "Operations" });
}
