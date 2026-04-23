import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthStore, SESSION_COOKIE_NAME } from "@/lib/auth-store";
import { log } from "@/lib/logger";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  getAuthStore().logout(token);
  jar.delete(SESSION_COOKIE_NAME);
  log.info("api.auth.logout", {});
  return NextResponse.json({ ok: true });
}
