import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { buildAuthUrl, hasGoogleOAuth } from "@/lib/google-oauth";
import { fail, unauthorized } from "@/lib/api";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasGoogleOAuth()) return fail("Google OAuth not configured", 503);

  // Optional return_to: where to send the user after callback succeeds.
  const returnTo = req.nextUrl.searchParams.get("return_to") || "/app";
  const state = `${user.id}.${crypto.randomBytes(12).toString("hex")}`;

  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("google_oauth_return_to", returnTo, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
