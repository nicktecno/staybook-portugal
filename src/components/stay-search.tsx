"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { StayListItem } from "@/types";
import { fetchStays } from "@/lib/api";
import { StayCard } from "@/components/stay-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";

export function StaySearch() {
  const queryId = useId();
  const typeId = useId();
  const sortId = useId();

  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [sort, setSort] = useState<string>("recommended");
  const [stays, setStays] = useState<StayListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      query: query.trim() || undefined,
      propertyType: propertyType === "all" ? undefined : propertyType,
      sort,
    }),
    [query, propertyType, sort],
  );

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchStays({ ...params, signal });
        setStays(res.stays);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message);
        setStays(null);
      } finally {
        setLoading(false);
      }
    },
    [params],
  );

  useEffect(() => {
    const ac = new AbortController();
    const t = window.setTimeout(() => {
      void load(ac.signal);
    }, 0);
    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-primary to-primary/85 px-6 py-10 text-primary-foreground shadow-xl sm:px-10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-secondary/25 blur-3xl" aria-hidden />
        <div className="relative max-w-2xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">Portugal stays</p>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Find your next place — clear pricing, real reviews, signed-in checkout
          </h1>
          <p className="max-w-xl text-primary-foreground/90">
            Hotels, apartments, and hostels in one flow. This demo runs entirely on your machine with in-memory data.
          </p>
        </div>
      </section>

      <section
        aria-label="Search and filters"
        className="rounded-2xl border-2 border-primary/15 bg-card p-1 shadow-2xl shadow-primary/10 ring-1 ring-black/[0.04] dark:ring-white/10"
      >
        <div className="flex flex-col gap-5 rounded-[calc(var(--radius-2xl)-2px)] bg-gradient-to-b from-card to-muted/30 p-4 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor={queryId} className="text-sm font-semibold text-foreground">
              Search destinations or properties
            </Label>
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-primary"
                  aria-hidden
                />
                <Input
                  id={queryId}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Try Lisbon, Porto, beach, loft…"
                  autoComplete="off"
                  className="h-14 rounded-xl border-2 border-primary/20 bg-background pl-12 pr-4 text-base shadow-inner transition-[border-color,box-shadow] placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="h-14 shrink-0 rounded-xl px-6 font-semibold shadow-md sm:w-auto"
                onClick={() => void load()}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
                Refresh
              </Button>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <div className="space-y-2">
              <Label id={typeId} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Property type
              </Label>
              <Select
                value={propertyType}
                onValueChange={(v) => {
                  if (v) setPropertyType(v);
                }}
              >
                <SelectTrigger
                  aria-labelledby={typeId}
                  className="h-12 rounded-xl border-2 border-primary/15 bg-background text-base shadow-sm"
                >
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="hostel">Hostel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label id={sortId} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sort by
              </Label>
              <Select
                value={sort}
                onValueChange={(v) => {
                  if (v) setSort(v);
                }}
              >
                <SelectTrigger
                  aria-labelledby={sortId}
                  className="h-12 rounded-xl border-2 border-primary/15 bg-background text-base shadow-sm"
                >
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating_desc">Top rated</SelectItem>
                  <SelectItem value="price_asc">Price: low to high</SelectItem>
                  <SelectItem value="price_desc">Price: high to low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button type="button" variant="outline" onClick={() => void load()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border bg-card p-3">
              <Skeleton className="aspect-[16/10] w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : stays && stays.length === 0 ? (
        <div className="rounded-xl border border-dashed border-primary/25 bg-muted/50 p-12 text-center">
          <p className="text-lg font-semibold text-foreground">No stays match your search</p>
          <p className="mt-2 text-sm text-muted-foreground">Clear the search box or switch property type.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stays?.map((s) => (
            <StayCard key={s.id} stay={s} />
          ))}
        </div>
      )}
    </div>
  );
}
