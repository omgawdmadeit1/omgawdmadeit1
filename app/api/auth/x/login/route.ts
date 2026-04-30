import { env } from "@/lib/env";
import { createAuthUrl, createPkcePair } from "@/lib/x-auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const { verifier, challenge, state } = createPkcePair();
  const cookieStore = await cookies();
  cookieStore.set("x_code_verifier", verifier, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  cookieStore.set("x_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  const url = createAuthUrl(env.X_CLIENT_ID, env.X_REDIRECT_URI, challenge, state);
  return NextResponse.redirect(url);
}
