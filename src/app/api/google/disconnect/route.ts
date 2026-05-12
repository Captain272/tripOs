import { getCurrentUser } from "@/lib/supabase/server";
import { deleteTokens } from "@/lib/google-oauth";
import { ok, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  await deleteTokens(user.id);
  return ok({ disconnected: true });
}
