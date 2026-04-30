import { prisma } from "@/lib/prisma";
import { createTweet } from "@/lib/x-client";

const SAFETY_DELAY_MS = 60_000;
const MAX_RETRIES = 3;

export async function publishPost(postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, include: { user: true } });
  if (!post) throw new Error("Post not found");
  if (!post.user.accessToken) throw new Error("User is not connected to X");
  if (post.user.requireApproval && !post.approved) throw new Error("Post requires approval");

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const publishedToday = await prisma.post.count({
    where: { userId: post.userId, status: "PUBLISHED", publishedAt: { gte: todayStart, lte: todayEnd } },
  });
  if (publishedToday >= post.user.dailyPostLimit) throw new Error("Daily post limit reached");

  const latestPublish = await prisma.post.findFirst({
    where: { userId: post.userId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
  if (latestPublish?.publishedAt && Date.now() - latestPublish.publishedAt.getTime() < SAFETY_DELAY_MS) {
    throw new Error("Safety delay active");
  }

  if (post.user.rateLimitedUntil && post.user.rateLimitedUntil > new Date()) {
    throw new Error(`Rate limited until ${post.user.rateLimitedUntil.toISOString()}`);
  }

  try {
    const response = await createTweet(post.user.accessToken, post.content);
    if (!response.ok) {
      await prisma.user.update({ where: { id: post.userId }, data: { rateLimitedUntil: response.rateLimitedUntil } });
      await prisma.publishLog.create({ data: { postId, success: false, statusCode: 429, message: "Rate limited" } });
      return;
    }

    await prisma.post.update({ where: { id: postId }, data: { status: "PUBLISHED", publishedAt: new Date(), lastAttemptAt: new Date() } });
    await prisma.publishLog.create({ data: { postId, success: true, statusCode: 201, message: "Published" } });
  } catch (error) {
    const retryCount = post.retryCount + 1;
    await prisma.post.update({
      where: { id: postId },
      data: {
        retryCount,
        lastAttemptAt: new Date(),
        status: retryCount >= MAX_RETRIES ? "FAILED" : "SCHEDULED",
        scheduledFor: retryCount >= MAX_RETRIES ? post.scheduledFor : new Date(Date.now() + retryCount * 60_000),
      },
    });
    await prisma.publishLog.create({
      data: { postId, success: false, message: error instanceof Error ? error.message : "Unknown publish error" },
    });
    throw error;
  }
}
