import { randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { UserPublic } from "@/types";

const globalForAuth = globalThis as unknown as {
  __authStore?: AuthStore;
};

export const SESSION_COOKIE_NAME = "staybook_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
};

type SessionRecord = {
  userId: string;
  expiresAt: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

class AuthStore {
  private usersById = new Map<string, UserRecord>();
  private userIdByEmail = new Map<string, string>();
  private sessions = new Map<string, SessionRecord>();

  constructor() {
    this.seedDemoUser();
  }

  private seedDemoUser() {
    if (this.usersById.size > 0) return;
    const id = "user_demo";
    const email = normalizeEmail("demo@example.com");
    this.usersById.set(id, {
      id,
      email,
      displayName: "Demo account",
      passwordHash: hashPassword("demo1234"),
    });
    this.userIdByEmail.set(email, id);
  }

  register(input: { email: string; password: string; displayName: string }): { ok: true; user: UserPublic } | { ok: false; error: string } {
    const email = normalizeEmail(input.email);
    if (!email.includes("@")) return { ok: false, error: "Invalid email." };
    if (input.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
    if (this.userIdByEmail.has(email)) return { ok: false, error: "An account with this email already exists." };
    const id = `user_${Date.now()}_${randomBytes(4).toString("hex")}`;
    const displayName = input.displayName.trim() || email.split("@")[0] || "Traveler";
    const user: UserRecord = {
      id,
      email,
      displayName,
      passwordHash: hashPassword(input.password),
    };
    this.usersById.set(id, user);
    this.userIdByEmail.set(email, id);
    return { ok: true, user: { id: user.id, email: user.email, displayName: user.displayName } };
  }

  login(email: string, password: string): { ok: true; token: string; user: UserPublic } | { ok: false; error: string } {
    const e = normalizeEmail(email);
    const id = this.userIdByEmail.get(e);
    if (!id) return { ok: false, error: "Invalid email or password." };
    const user = this.usersById.get(id);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { ok: false, error: "Invalid email or password." };
    }
    const token = randomBytes(32).toString("hex");
    const expiresAt = Date.now() + SESSION_MAX_AGE_SEC * 1000;
    this.sessions.set(token, { userId: user.id, expiresAt });
    return {
      ok: true,
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    };
  }

  logout(token: string | undefined) {
    if (token) this.sessions.delete(token);
  }

  validateSession(token: string | undefined): UserPublic | null {
    if (!token) return null;
    const s = this.sessions.get(token);
    if (!s || s.expiresAt < Date.now()) {
      if (s) this.sessions.delete(token);
      return null;
    }
    const user = this.usersById.get(s.userId);
    if (!user) {
      this.sessions.delete(token);
      return null;
    }
    return { id: user.id, email: user.email, displayName: user.displayName };
  }

  getUserById(id: string): UserPublic | null {
    const u = this.usersById.get(id);
    if (!u) return null;
    return { id: u.id, email: u.email, displayName: u.displayName };
  }
}

export function getAuthStore(): AuthStore {
  if (!globalForAuth.__authStore) {
    globalForAuth.__authStore = new AuthStore();
  }
  return globalForAuth.__authStore;
}
