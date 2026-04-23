import { cookies } from "next/headers";
import { getAuthStore, SESSION_COOKIE_NAME } from "@/lib/auth-store";
import type { UserPublic } from "@/types";

export async function readSessionUser(): Promise<UserPublic | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  return getAuthStore().validateSession(token);
}
