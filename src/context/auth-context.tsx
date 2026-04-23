"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UserPublic } from "@/types";
import { fetchSession, postLogin, postLogout, postRegister } from "@/lib/auth-client";

type AuthState = {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await fetchSession();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u } = await postLogin(email, password);
    setUser(u);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const { user: u } = await postRegister(email, password, displayName);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await postLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
