import { cookies } from "next/headers";

const COOKIE_NAME = "hub_session_id";
const MAX_AGE = 86400; // 24 hours

/** Read session ID from cookie (server components). Returns null if not set. */
export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/** Read or create session ID (API routes). Sets cookie if missing. */
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  cookieStore.set(COOKIE_NAME, id, {
    maxAge: MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return id;
}
