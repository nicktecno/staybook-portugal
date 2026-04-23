"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Booking, Stay } from "@/types";
import { fetchBooking } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function money(n: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
}

export function BookingConfirmationView({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [stay, setStay] = useState<Stay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchBooking(bookingId);
        if (cancelled) return;
        setBooking(res.booking);
        setStay(res.stay);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message);
        setBooking(null);
        setStay(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const errLower = error?.toLowerCase() ?? "";
  const needsLogin = errLower.includes("signed in") || errLower.includes("must be signed");

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 sm:px-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 sm:px-6">
          <Alert variant="destructive">
            <AlertTitle>{needsLogin ? "Sign in required" : "Confirmation unavailable"}</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>{error ?? "Unknown error"}</p>
              {needsLogin ? (
                <Link
                  href={`/login?returnUrl=${encodeURIComponent(`/bookings/confirmation?id=${encodeURIComponent(bookingId)}`)}`}
                  className={cn(buttonVariants({ variant: "secondary" }), "inline-flex font-semibold")}
                >
                  Sign in
                </Link>
              ) : (
                <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}>
                  Browse stays
                </Link>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">You&apos;re booked</h1>
          <p className="text-muted-foreground">Mock payment reference and summary — keep your booking ID.</p>
        </div>

        <Card className="border-primary/10 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
            <CardDescription>{stay?.title ?? "Stay"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Booking ID: <span className="font-mono font-medium">{booking.id}</span>
            </p>
            <p>
              Payment reference: <span className="font-mono font-medium">{booking.paymentRef}</span>
            </p>
            <p>
              Guest:{" "}
              <span className="font-medium">
                {booking.guestName} ({booking.guestEmail})
              </span>
            </p>
            <p>
              Dates:{" "}
              <span className="font-medium">
                {booking.checkIn} → {booking.checkOut}
              </span>
            </p>
            <p>
              Guests: <span className="font-medium">{booking.guests}</span>
            </p>
            <p className="pt-2 text-base font-semibold text-primary">Total {money(booking.totalPrice, booking.currency)}</p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Link href="/bookings" className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}>
            My bookings
          </Link>
          <Link href="/" className={cn(buttonVariants(), "inline-flex")}>
            New search
          </Link>
        </div>
      </main>
    </div>
  );
}
