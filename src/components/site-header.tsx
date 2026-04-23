"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-primary/20 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground shadow-sm">
            <MapPin className="size-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">Staybook Portugal</span>
          <span className="sm:hidden">Staybook</span>
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center justify-end gap-2 text-sm">
          {user ? (
            <>
              <Link
                href="/bookings"
                className="rounded-md px-3 py-2 text-primary-foreground/90 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                My bookings
              </Link>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="font-semibold shadow-sm"
                onClick={() => void logout()}
                disabled={loading}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "font-semibold shadow-sm",
                )}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md px-3 py-2 text-primary-foreground/90 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
