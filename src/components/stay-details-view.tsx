"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { format, isBefore, parseISO, startOfToday } from "date-fns";
import type { Review, Stay } from "@/types";
import { fetchReviews, fetchStay } from "@/lib/api";
import { isRangeAvailable } from "@/lib/availability";
import { quoteStay } from "@/lib/pricing";
import { postReview } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Star } from "lucide-react";
import { cn } from "@/lib/utils";

function money(n: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
}

export function StayDetailsView({ stayId }: { stayId: string }) {
  const router = useRouter();
  const guestsId = useId();
  const authorId = useId();
  const ratingId = useId();
  const textId = useId();

  const [stay, setStay] = useState<Stay | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);

  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, r] = await Promise.all([fetchStay(stayId), fetchReviews(stayId)]);
      setStay(s.stay);
      setReviews(r.reviews);
    } catch (e) {
      setError((e as Error).message);
      setStay(null);
      setReviews(null);
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

  const checkInIso = range?.from ? format(range.from, "yyyy-MM-dd") : "";
  const checkOutIso = range?.to ? format(range.to, "yyyy-MM-dd") : "";

  const availabilityOk = useMemo(() => {
    if (!stay || !checkInIso || !checkOutIso) return null;
    return isRangeAvailable(checkInIso, checkOutIso, stay.blockedRanges);
  }, [stay, checkInIso, checkOutIso]);

  const quote = useMemo(() => {
    if (!stay || !checkInIso || !checkOutIso) return null;
    return quoteStay({
      basePricePerNight: stay.basePricePerNight,
      cleaningFee: stay.cleaningFee,
      checkIn: checkInIso,
      checkOut: checkOutIso,
    });
  }, [stay, checkInIso, checkOutIso]);

  const disabledDays = useMemo(() => {
    if (!stay) return undefined;
    const today = startOfToday();
    return (date: Date) => {
      if (isBefore(date, today)) return true;
      return stay.blockedRanges.some((br) => {
        const start = parseISO(br.start);
        const end = parseISO(br.end);
        return date >= start && date <= end;
      });
    };
  }, [stay]);

  async function onSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await postReview(stayId, { author: reviewAuthor, rating: reviewRating, text: reviewText });
      setReviewAuthor("");
      setReviewText("");
      setReviewRating(5);
      const r = await fetchReviews(stayId);
      setReviews(r.reviews);
      await load();
    } catch (err) {
      setReviewError((err as Error).message);
    } finally {
      setReviewSubmitting(false);
    }
  }

  function continueCheckout() {
    if (!stay) return;
    if (!checkInIso || !checkOutIso) return;
    if (!availabilityOk) return;
    if (guests < 1 || guests > stay.maxGuests) return;
    const sp = new URLSearchParams({
      checkIn: checkInIso,
      checkOut: checkOutIso,
      guests: String(guests),
    });
    router.push(`/stays/${stay.id}/checkout?${sp.toString()}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
          <Skeleton className="h-10 w-2/3 max-w-xl" />
          <Skeleton className="aspect-[21/9] w-full rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-40 lg:col-span-2" />
            <Skeleton className="h-56" />
          </div>
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
            <AlertTitle>Could not load this stay</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error ?? "Unknown error"}</span>
              <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                Back to listings
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
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="capitalize">{stay.propertyType}</Badge>
            <Badge variant="secondary">
              Up to {stay.maxGuests} guests
            </Badge>
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{stay.title}</h1>
          <p className="text-muted-foreground">
            {stay.city}, {stay.country}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            <span className="font-medium">{stay.ratingAvg.toFixed(1)}</span>
            <span className="text-muted-foreground">({stay.reviewCount} reviews)</span>
          </div>
        </div>

        <div className="relative aspect-[21/9] overflow-hidden rounded-xl border">
          <Image src={stay.imageUrl} alt="" fill priority className="object-cover" sizes="100vw" />
          <span className="sr-only">{stay.title}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div className="space-y-6 lg:col-span-2">
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-lg font-semibold">
                About this stay
              </h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground leading-relaxed">{stay.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {stay.amenities.map((a) => (
                  <Badge key={a} variant="outline">
                    {a}
                  </Badge>
                ))}
              </div>
            </section>

            <Separator />

            <section aria-labelledby="reviews-heading" className="space-y-4">
              <h2 id="reviews-heading" className="text-lg font-semibold">
                Reviews
              </h2>
              {reviews && reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
              ) : (
                <ul className="space-y-4">
                  {reviews?.map((rev) => (
                    <li key={rev.id} className="rounded-lg border bg-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{rev.author}</p>
                        <p className="text-xs text-muted-foreground">{new Date(rev.createdAt).toLocaleString()}</p>
                      </div>
                      <p className="mt-1 text-sm">
                        <span className="font-medium">{rev.rating}/5</span>
                        <span className="text-muted-foreground"> · Rating</span>
                      </p>
                      <p className="mt-2 text-sm leading-relaxed">{rev.text}</p>
                    </li>
                  ))}
                </ul>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Write a review</CardTitle>
                  <CardDescription>Basic moderation applies (length, links, obvious spam words).</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={onSubmitReview}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={authorId}>Name</Label>
                        <Input id={authorId} value={reviewAuthor} onChange={(e) => setReviewAuthor(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={ratingId}>Rating</Label>
                        <Input
                          id={ratingId}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={5}
                          step={1}
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={textId}>Comments</Label>
                      <Textarea id={textId} value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4} required />
                    </div>
                    {reviewError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Review not posted</AlertTitle>
                        <AlertDescription>{reviewError}</AlertDescription>
                      </Alert>
                    ) : null}
                    <Button type="submit" disabled={reviewSubmitting}>
                      {reviewSubmitting ? "Posting…" : "Post review"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Availability & price</CardTitle>
                <CardDescription>Select dates to see totals. Blocked dates cannot be selected.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Popover>
                  <PopoverTrigger
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-auto min-h-8 w-full justify-start py-2 text-left font-normal whitespace-normal",
                      !range?.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarDays className="mr-2 size-4 shrink-0" aria-hidden />
                    {range?.from ? (
                      range.to ? (
                        <>
                          {format(range.from, "LLL dd, y")} – {format(range.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(range.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      numberOfMonths={2}
                      selected={range}
                      onSelect={setRange}
                      disabled={disabledDays}
                      defaultMonth={range?.from}
                    />
                  </PopoverContent>
                </Popover>

                <div className="space-y-2">
                  <Label htmlFor={guestsId}>Guests</Label>
                  <Input
                    id={guestsId}
                    type="number"
                    min={1}
                    max={stay.maxGuests}
                    step={1}
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum {stay.maxGuests} for this property.</p>
                </div>

                {checkInIso && checkOutIso ? (
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    {availabilityOk === false ? (
                      <p className="text-destructive">These dates overlap unavailable periods.</p>
                    ) : quote ? (
                      <div className="space-y-1">
                        <p>
                          <span className="text-muted-foreground">{quote.nights} nights · Rooms</span>
                        </p>
                        <p>
                          Subtotal: <span className="font-medium">{money(quote.subtotal, stay.currency)}</span>
                        </p>
                        {quote.cleaningFee > 0 ? (
                          <p>
                            Cleaning: <span className="font-medium">{money(quote.cleaningFee, stay.currency)}</span>
                          </p>
                        ) : null}
                        <Separator className="my-2" />
                        <p className="text-base font-semibold">
                          Total: {money(quote.total, stay.currency)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Pick a valid range (checkout after check-in).</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Choose check-in and checkout to see pricing.</p>
                )}

                <Button
                  type="button"
                  className="w-full"
                  disabled={
                    !checkInIso ||
                    !checkOutIso ||
                    !availabilityOk ||
                    !quote ||
                    guests < 1 ||
                    guests > stay.maxGuests
                  }
                  onClick={continueCheckout}
                >
                  Continue to checkout
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
