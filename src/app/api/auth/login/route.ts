import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthStore, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEC } from "@/lib/auth-store";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = "email" in body && typeof body.email === "string" ? body.email : "";
  const password = "password" in body && typeof body.password === "string" ? body.password : "";

  const auth = getAuthStore();
  const res = auth.login(email, password);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, res.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });

  log.info("api.auth.login", { userId: res.user.id });
  return NextResponse.json({ user: res.user });
}
