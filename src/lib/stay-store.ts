import type { Booking, Review, Stay, StayListItem } from "@/types";
import { SEED_REVIEWS, SEED_STAYS } from "@/lib/stay-seed";

const globalForStore = globalThis as unknown as {
  __stayStore?: StayStore;
};

type SortKey = "recommended" | "price_asc" | "price_desc" | "rating_desc";

class StayStore {
  private stays: Stay[];
  private reviews: Review[];
  private bookings: Booking[] = [];

  constructor() {
    this.stays = structuredClone(SEED_STAYS);
    this.reviews = structuredClone(SEED_REVIEWS);
  }

  listStays(params: {
    query?: string;
    propertyType?: string;
    sort?: string;
  }): StayListItem[] {
    const q = (params.query ?? "").trim().toLowerCase();
    let rows = this.stays.filter((s) => {
      if (params.propertyType && params.propertyType !== "all") {
        if (s.propertyType !== params.propertyType) return false;
      }
      if (!q) return true;
      const blob = `${s.title} ${s.city} ${s.country} ${s.description}`.toLowerCase();
      return blob.includes(q);
    });

    const sort = (params.sort ?? "recommended") as SortKey;
    rows = [...rows].sort((a, b) => {
      if (sort === "price_asc") return a.basePricePerNight - b.basePricePerNight;
      if (sort === "price_desc") return b.basePricePerNight - a.basePricePerNight;
      if (sort === "rating_desc") {
        if (b.ratingAvg !== a.ratingAvg) return b.ratingAvg - a.ratingAvg;
        return b.reviewCount - a.reviewCount;
      }
      return b.ratingAvg * Math.log1p(b.reviewCount) - a.ratingAvg * Math.log1p(a.reviewCount);
    });

    return rows.map((s) => ({
      id: s.id,
      title: s.title,
      city: s.city,
      country: s.country,
      imageUrl: s.imageUrl,
      propertyType: s.propertyType,
      basePricePerNight: s.basePricePerNight,
      currency: s.currency,
      ratingAvg: s.ratingAvg,
      reviewCount: s.reviewCount,
      maxGuests: s.maxGuests,
    }));
  }

  getStay(id: string): Stay | undefined {
    return this.stays.find((s) => s.id === id);
  }

  listReviews(stayId: string): Review[] {
    return this.reviews
      .filter((r) => r.stayId === stayId && r.status === "visible")
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  addReview(input: {
    stayId: string;
    author: string;
    rating: number;
    text: string;
    status: Review["status"];
  }): Review {
    const id = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const review: Review = {
      id,
      stayId: input.stayId,
      author: input.author.trim(),
      rating: input.rating,
      text: input.text.trim(),
      createdAt: new Date().toISOString(),
      status: input.status,
    };
    this.reviews.push(review);
    this.recomputeAggregates(input.stayId);
    return review;
  }

  private recomputeAggregates(stayId: string) {
    const stay = this.getStay(stayId);
    if (!stay) return;
    const visible = this.reviews.filter((r) => r.stayId === stayId && r.status === "visible");
    if (visible.length === 0) {
      stay.ratingAvg = 0;
      stay.reviewCount = 0;
      return;
    }
    const sum = visible.reduce((acc, r) => acc + r.rating, 0);
    stay.ratingAvg = Math.round((sum / visible.length) * 10) / 10;
    stay.reviewCount = visible.length;
  }

  addBooking(booking: Booking) {
    this.bookings.push(booking);
  }

  listBookings(): Booking[] {
    return [...this.bookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  getBooking(id: string): Booking | undefined {
    return this.bookings.find((b) => b.id === id);
  }
}

export function getStayStore(): StayStore {
  if (!globalForStore.__stayStore) {
    globalForStore.__stayStore = new StayStore();
  }
  return globalForStore.__stayStore;
}
