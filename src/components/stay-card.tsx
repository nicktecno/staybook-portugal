import Image from "next/image";
import Link from "next/link";
import type { StayListItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Star } from "lucide-react";

function formatPrice(n: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function StayCard({ stay }: { stay: StayListItem }) {
  return (
    <Card className="overflow-hidden border-primary/10 pt-0 shadow-md transition-shadow hover:shadow-lg hover:border-primary/20">
      <CardHeader className="p-0">
        <Link href={`/stays/${stay.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={stay.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={false}
            />
            <span className="sr-only">{stay.title}</span>
          </div>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {stay.propertyType}
          </Badge>
          <span className="text-xs text-muted-foreground">Up to {stay.maxGuests} guests</span>
        </div>
        <Link
          href={`/stays/${stay.id}`}
          className="block rounded-sm font-medium leading-snug hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {stay.title}
        </Link>
        <p className="text-sm text-muted-foreground">
          {stay.city}, {stay.country}
        </p>
        <div className="flex items-center gap-1 text-sm">
          <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
          <span className="font-medium">{stay.ratingAvg.toFixed(1)}</span>
          <span className="text-muted-foreground">({stay.reviewCount} reviews)</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t px-4 py-3 text-sm">
        <div>
          <span className="text-muted-foreground">From </span>
          <span className="font-semibold">{formatPrice(stay.basePricePerNight, stay.currency)}</span>
          <span className="text-muted-foreground"> / night</span>
        </div>
        <Link
          href={`/stays/${stay.id}`}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View
        </Link>
      </CardFooter>
    </Card>
  );
}
