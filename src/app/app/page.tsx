import { redirect } from "next/navigation";

// /app → /app/trips (default landing for authenticated users)
export default function AppHome() {
  redirect("/app/trips");
}
