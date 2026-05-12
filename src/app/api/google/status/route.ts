import { getCurrentUser } from "@/lib/supabase/server";
import { hasGoogleOAuth, isConnected, getValidAccessToken } from "@/lib/google-oauth";
import { ok, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/google/status
 * Returns connection status and, if connected and ?token=1, a short-lived
 * access token (so the client-side Picker can call Drive on the user's behalf).
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const configured = hasGoogleOAuth();
  if (!configured) return ok({ configured: false, connected: false });

  const connected = await isConnected(user.id);
  const wantsToken = new URL(req.url).searchParams.get("token") === "1";

  if (!connected || !wantsToken) {
    return ok({ configured: true, connected });
  }
  try {
    const access_token = await getValidAccessToken(user.id);
    return ok({ configured: true, connected: true, access_token });
  } catch {
    return ok({ configured: true, connected: false });
  }
}
