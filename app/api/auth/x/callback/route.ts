import { exchangeCodeForToken } from "@/lib/x-client";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("x_state")?.value;
  const verifier = cookieStore.get("x_code_verifier")?.value;
  if (!code || !state || !savedState || state !== savedState || !verifier) {
    return NextResponse.json({ error: "Invalid auth callback" }, { status: 400 });
  }

  const token = await exchangeCodeForToken(code, verifier);
  await prisma.user.upsert({
    where: { id: "default-user" },
    update: { accessToken: token.access_token, refreshToken: token.refresh_token },
    create: { id: "default-user", accessToken: token.access_token, refreshToken: token.refresh_token },
  });

  return NextResponse.redirect(new URL("/", req.url));
}
