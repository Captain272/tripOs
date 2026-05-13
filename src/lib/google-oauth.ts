/**
 * Google OAuth helpers (Drive). Tokens stored in google_oauth_tokens
 * keyed by Supabase user id. Service-role access only — never expose
 * tokens to the browser.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
];

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

export const hasGoogleOAuth = () => Boolean(CLIENT_ID && CLIENT_SECRET);

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function redirectUri(): string {
  return `${appUrl()}/api/google/callback`;
}

/** Authorisation URL to redirect the user to. `state` is opaque to Google. */
export function buildAuthUrl(state: string): string {
  if (!CLIENT_ID) throw new Error("GOOGLE_OAUTH_CLIENT_ID not set");
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: DRIVE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent", // ensure refresh_token on every connect
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error("Google OAuth not configured");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error("Google OAuth not configured");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function saveTokens(userId: string, tokens: TokenResponse): Promise<void> {
  const admin = getSupabaseAdmin();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;
  // On a refresh, Google omits refresh_token — keep the existing one in that case.
  const update: Record<string, unknown> = {
    user_id: userId,
    access_token: tokens.access_token,
    expires_at: expiresAt,
    scope: tokens.scope ?? null,
  };
  if (tokens.refresh_token) update.refresh_token = tokens.refresh_token;
  const { error } = await admin
    .from("google_oauth_tokens")
    .upsert(update, { onConflict: "user_id" });
  if (error) throw new Error(`saveTokens failed: ${error.message}`);
}

export async function deleteTokens(userId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin.from("google_oauth_tokens").delete().eq("user_id", userId);
}

export async function isConnected(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("google_oauth_tokens")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Returns a valid (non-expired) access token, refreshing via refresh_token
 * when needed. Throws if the user isn't connected.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("google_oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Google Drive is not connected for this user");

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const skew = 60 * 1000; // refresh 60s before expiry
  if (expiresAt && Date.now() < expiresAt - skew) return data.access_token;

  if (!data.refresh_token) {
    // No refresh token — token may still work; return what we have.
    return data.access_token;
  }
  const refreshed = await refreshAccessToken(data.refresh_token);
  await saveTokens(userId, refreshed);
  return refreshed.access_token;
}
