"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Stay } from "@/types";
import { fetchStay, postBooking } from "@/lib/api";
import { isRangeAvailable } from "@/lib/availability";
import { quoteStay } from "@/lib/pricing";
import { useAuth } from "@/context/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function money(n: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
}

export function CheckoutView({ stayId }: { stayId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const checkIn = sp.get("checkIn") ?? "";
  const checkOut = sp.get("checkOut") ?? "";
  const guestsInitial = Number(sp.get("guests") ?? "2");

  const nameId = useId();

  const [stay, setStay] = useState<Stay | null>(null);
  const [calendarBlocks, setCalendarBlocks] = useState<{ start: string; end: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guestName, setGuestName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const guests = Number.isFinite(guestsInitial) && guestsInitial > 0 ? Math.floor(guestsInitial) : 2;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await fetchStay(stayId);
      setStay(s.stay);
      setCalendarBlocks(s.calendarBlocks);
    } catch (e) {
      setError((e as Error).message);
      setStay(null);
      setCalendarBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [stayId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const qs = sp.toString();
      const here = qs ? `${pathname}?${qs}` : pathname;
      const ret = encodeURIComponent(here);
      router.replace(`/login?returnUrl=${ret}`);
    }
  }, [authLoading, user, router, pathname, sp]);

  useEffect(() => {
    if (!user?.displayName) return;
    const t = window.setTimeout(() => {
      setGuestName((n) => (n.trim() ? n : user.displayName));
    }, 0);
    return () => window.clearTimeout(t);
  }, [user]);

  const okDates = useMemo(() => {
    if (!stay || !checkIn || !checkOut) return false;
    return isRangeAvailable(checkIn, checkOut, calendarBlocks);
  }, [stay, checkIn, checkOut, calendarBlocks]);

  const quote = useMemo(() => {
    if (!stay || !checkIn || !checkOut) return null;
    return quoteStay({
      basePricePerNight: stay.basePricePerNight,
      cleaningFee: stay.cleaningFee,
      checkIn,
      checkOut,
    });
  }, [stay, checkIn, checkOut]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stay || !user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await postBooking({
        stayId: stay.id,
        checkIn,
        checkOut,
        guests,
        guestName,
        paymentMethod,
      });
      router.push(`/bookings/confirmation?id=${encodeURIComponent(res.booking.id)}`);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-48 w-full" />
          <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !stay) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <Alert variant="destructive">
            <AlertTitle>Checkout unavailable</AlertTitle>
            <AlertDescription className="mt-2">{error ?? "Unknown error"}</AlertDescription>
          </Alert>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}>
            Home
          </Link>
        </div>
      </div>
    );
  }

  if (!checkIn || !checkOut || !okDates || !quote || guests > stay.maxGuests) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <Alert>
            <AlertTitle>Dates unavailable</AlertTitle>
            <AlertDescription className="mt-3 space-y-2">
              <p>
                This checkout link is incomplete, or those nights are no longer free (someone else may have booked
                them).
              </p>
              <Link href={`/stays/${stay.id}`} className={cn(buttonVariants())}>
                Back to stay
              </Link>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">Checkout</h1>
          <p className="mt-2 text-muted-foreground">
            Mock payment — the booking is tied to your account ({user.email}).
          </p>
        </div>

        <Card className="border-primary/10 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Trip summary</CardTitle>
            <CardDescription>{stay.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Dates:{" "}
              <span className="font-medium">
                {checkIn} → {checkOut}
              </span>
            </p>
            <p>
              Guests: <span className="font-medium">{guests}</span>
            </p>
            <Separator className="my-3" />
            <p>
              {quote.nights} nights · Subtotal <span className="font-medium">{money(quote.subtotal, stay.currency)}</span>
            </p>
            {quote.cleaningFee > 0 ? (
              <p>
                Cleaning <span className="font-medium">{money(quote.cleaningFee, stay.currency)}</span>
              </p>
            ) : null}
            <p className="text-base font-semibold text-primary">Total {money(quote.total, stay.currency)}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Guest & payment</CardTitle>
            <CardDescription>Confirmation email is sent to your account email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="rounded-lg border border-primary/10 bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Account: </span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor={nameId}>Name on booking</Label>
                <Input id={nameId} value={guestName} onChange={(e) => setGuestName(e.target.value)} autoComplete="name" required />
              </div>
              <div className="space-y-2">
                <Label>Payment method (mock)</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => {
                    if (v) setPaymentMethod(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mbway">MB Way</SelectItem>
                    <SelectItem value="apple_pay">Apple Pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {submitError ? (
                <Alert variant="destructive">
                  <AlertTitle>Booking failed</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Link href={`/stays/${stay.id}`} className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}>
                  Back
                </Link>
                <Button type="submit" disabled={submitting} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  {submitting ? "Confirming…" : "Confirm booking"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
