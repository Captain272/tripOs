import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { exchangeCode, saveTokens } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

function errorRedirect(req: NextRequest, message: string, returnTo: string): NextResponse {
  const url = new URL(returnTo, req.nextUrl.origin);
  url.searchParams.set("google_oauth_error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const returnTo = req.cookies.get("google_oauth_return_to")?.value || "/app";
  const cookieState = req.cookies.get("google_oauth_state")?.value;
  const params = req.nextUrl.searchParams;
  const queryState = params.get("state");
  const code = params.get("code");
  const errorParam = params.get("error");

  if (errorParam) return errorRedirect(req, errorParam, returnTo);
  if (!cookieState || !queryState || cookieState !== queryState) {
    return errorRedirect(req, "invalid_state", returnTo);
  }
  if (!code) return errorRedirect(req, "missing_code", returnTo);

  const user = await getCurrentUser();
  if (!user) return errorRedirect(req, "not_signed_in", returnTo);

  // state is "<user_id>.<nonce>" — verify the user_id matches.
  const [stateUserId] = queryState.split(".");
  if (stateUserId !== user.id) return errorRedirect(req, "user_mismatch", returnTo);

  try {
    const tokens = await exchangeCode(code);
    await saveTokens(user.id, tokens);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "exchange_failed";
    return errorRedirect(req, msg, returnTo);
  }

  const successUrl = new URL(returnTo, req.nextUrl.origin);
  successUrl.searchParams.set("google_connected", "1");
  const res = NextResponse.redirect(successUrl);
  res.cookies.delete("google_oauth_state");
  res.cookies.delete("google_oauth_return_to");
  return res;
}
