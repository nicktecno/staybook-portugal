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
import { Search } from "lucide-react";

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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <section className="space-y-3">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Find your next stay in Portugal</h1>
        <p className="max-w-2xl text-muted-foreground">
          Curated apartments, hotels, and hostels with transparent pricing, real reviews, and a checkout you can finish in
          minutes.
        </p>
      </section>

      <section aria-label="Search and filters" className="grid gap-4 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={queryId}>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id={queryId}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="City, neighborhood, vibe…"
              className="pl-9"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label id={typeId}>Property type</Label>
          <Select
            value={propertyType}
            onValueChange={(v) => {
              if (v) setPropertyType(v);
            }}
          >
            <SelectTrigger aria-labelledby={typeId}>
              <SelectValue placeholder="Type" />
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
          <Label id={sortId}>Sort</Label>
          <Select
            value={sort}
            onValueChange={(v) => {
              if (v) setSort(v);
            }}
          >
            <SelectTrigger aria-labelledby={sortId}>
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
        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <Button type="button" variant="secondary" className="w-full" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
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
        <div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center">
          <p className="font-medium">No stays match your filters</p>
          <p className="mt-2 text-sm text-muted-foreground">Try clearing search or switching property type.</p>
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
