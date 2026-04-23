"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Stay } from "@/types";
import { fetchStay } from "@/lib/api";
import { isRangeAvailable } from "@/lib/availability";
import { quoteStay } from "@/lib/pricing";
import { postBooking } from "@/lib/api";
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
  const sp = useSearchParams();
  const checkIn = sp.get("checkIn") ?? "";
  const checkOut = sp.get("checkOut") ?? "";
  const guestsInitial = Number(sp.get("guests") ?? "2");

  const nameId = useId();
  const emailId = useId();

  const [stay, setStay] = useState<Stay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
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
    } catch (e) {
      setError((e as Error).message);
      setStay(null);
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

  const okDates = useMemo(() => {
    if (!stay || !checkIn || !checkOut) return false;
    return isRangeAvailable(checkIn, checkOut, stay.blockedRanges);
  }, [stay, checkIn, checkOut]);

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
    if (!stay) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await postBooking({
        stayId: stay.id,
        checkIn,
        checkOut,
        guests,
        guestName,
        guestEmail,
        paymentMethod,
      });
      router.push(`/bookings/confirmation?id=${encodeURIComponent(res.booking.id)}`);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
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
            <AlertDescription className="mt-2">
              {error ?? "Unknown error"}
            </AlertDescription>
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
            <AlertTitle>Select dates again</AlertTitle>
            <AlertDescription className="mt-3 space-y-2">
              <p>Your checkout link is missing dates, or the stay is not available for the selected range.</p>
              <Link href={`/stays/${stay.id}`} className={cn(buttonVariants())}>
                Return to stay
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
          <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
          <p className="mt-2 text-muted-foreground">Payment is mocked — you will still receive a real confirmation record.</p>
        </div>

        <Card>
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
            <p className="text-base font-semibold">
              Total {money(quote.total, stay.currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Guest & payment</CardTitle>
            <CardDescription>We only use this to show a realistic checkout form.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={nameId}>Full name</Label>
                  <Input id={nameId} value={guestName} onChange={(e) => setGuestName(e.target.value)} autoComplete="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={emailId}>Email</Label>
                  <Input
                    id={emailId}
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
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
                <Button type="submit" disabled={submitting}>
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
