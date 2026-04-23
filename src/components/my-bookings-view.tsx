"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Booking, Stay } from "@/types";
import { cancelBooking, fetchMyBookings } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function money(n: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
}

export function MyBookingsView() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<{ booking: Booking; stay: Stay | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyBookings();
      setRows(res.bookings);
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?returnUrl=${encodeURIComponent("/bookings")}`);
      return;
    }
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [authLoading, user, load, router]);

  async function onCancel(id: string) {
    if (!window.confirm("Cancel this booking? Those nights will show as available again.")) return;
    setCancellingId(id);
    try {
      await cancelBooking(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCancellingId(null);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">My bookings</h1>
          <p className="mt-2 text-muted-foreground">Cancel to free those nights on the stay calendar.</p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : rows.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">No bookings yet</CardTitle>
              <CardDescription>Browse stays and complete checkout while signed in.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/" className={cn(buttonVariants(), "inline-flex w-fit")}>
                Browse stays
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-4">
            {rows.map(({ booking, stay }) => (
              <li key={booking.id}>
                <Card className="border-primary/10 shadow-sm">
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">{stay?.title ?? "Stay"}</CardTitle>
                      <CardDescription>
                        {booking.checkIn} → {booking.checkOut} · {booking.guests} guests
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      disabled={cancellingId === booking.id}
                      onClick={() => void onCancel(booking.id)}
                    >
                      {cancellingId === booking.id ? "Cancelling…" : "Cancel booking"}
                    </Button>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Total (mock)</span>
                    <span className="font-semibold text-primary">{money(booking.totalPrice, booking.currency)}</span>
                    {stay ? (
                      <Link href={`/stays/${stay.id}`} className="text-primary underline-offset-4 hover:underline">
                        View stay
                      </Link>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
