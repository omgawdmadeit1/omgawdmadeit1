import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  content: z.string().min(1).max(280),
  scheduledFor: z.string().datetime().optional(),
  approved: z.boolean().optional(),
});

export async function GET() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { logs: true } });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const data = bodySchema.parse(await req.json());
  const existingDuplicate = await prisma.post.findFirst({
    where: { userId: "default-user", content: data.content, status: { in: ["DRAFT", "SCHEDULED"] } },
  });
  if (existingDuplicate) return NextResponse.json({ error: "Duplicate draft/scheduled content blocked" }, { status: 409 });

  const post = await prisma.post.create({
    data: {
      userId: "default-user",
      content: data.content,
      status: data.scheduledFor ? PostStatus.SCHEDULED : PostStatus.DRAFT,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      approved: data.approved ?? false,
    },
  });
  return NextResponse.json(post, { status: 201 });
}
