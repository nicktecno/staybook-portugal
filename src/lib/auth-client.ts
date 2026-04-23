import type { UserPublic } from "@/types";

const jsonHeaders = { "Content-Type": "application/json" };

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Empty response (${response.status})`);
  return JSON.parse(text) as T;
}

export async function fetchSession(): Promise<{ user: UserPublic | null }> {
  const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Session unavailable.");
  return parseJson<{ user: UserPublic | null }>(res);
}

export async function postLogin(email: string, password: string): Promise<{ user: UserPublic }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: jsonHeaders,
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson<{ user?: UserPublic; error?: string }>(res);
  if (!res.ok) throw new Error(data.error ?? "Sign-in failed.");
  if (!data.user) throw new Error("Invalid response.");
  return { user: data.user };
}

export async function postRegister(
  email: string,
  password: string,
  displayName: string,
): Promise<{ user: UserPublic }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: jsonHeaders,
    credentials: "include",
    body: JSON.stringify({ email, password, displayName }),
  });
  const data = await parseJson<{ user?: UserPublic; error?: string }>(res);
  if (!res.ok) throw new Error(data.error ?? "Registration failed.");
  if (!data.user) throw new Error("Invalid response.");
  return { user: data.user };
}

export async function postLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}
