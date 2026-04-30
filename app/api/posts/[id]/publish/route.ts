import { publishPost } from "@/lib/publisher";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await publishPost(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
