import { env } from "@/lib/env";
import { publishPost } from "@/lib/publisher";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-cron-secret") !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.post.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: new Date() } },
    orderBy: { scheduledFor: "asc" },
    take: 20,
  });

  const results = [] as Array<{ postId: string; ok: boolean; error?: string }>;
  for (const post of due) {
    try {
      await publishPost(post.id);
      results.push({ postId: post.id, ok: true });
    } catch (error) {
      results.push({ postId: post.id, ok: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  return NextResponse.json({ processed: due.length, results });
}
