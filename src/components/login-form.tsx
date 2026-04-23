"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function pickReturnUrl(raw: string | null): string {
  if (!raw) return "/";
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return "/";
    return decoded;
  } catch {
    return "/";
  }
}

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      await login(email, password);
      router.push(pickReturnUrl(sp.get("returnUrl")));
      router.refresh();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <Card className="border-primary/15 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Sign in</CardTitle>
            <CardDescription>Demo: demo@example.com / demo1234</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {err ? (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={pending}>
                {pending ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                No account?{" "}
                <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                  Create one
                </Link>
              </p>
              <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-full justify-center")}>
                Back to home
              </Link>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
