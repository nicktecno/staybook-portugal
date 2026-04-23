import type { Booking, Review, Stay, StayListItem } from "@/types";

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    throw new Error(`Empty response (${response.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON (${response.status})`);
  }
}

async function errorMessageFromResponse(res: Response, fallback: string) {
  try {
    const data = await parseJson<{ error?: string }>(res);
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchStays(params: {
  query?: string;
  propertyType?: string;
  sort?: string;
  signal?: AbortSignal;
}): Promise<{ stays: StayListItem[] }> {
  const sp = new URLSearchParams();
  if (params.query) sp.set("query", params.query);
  if (params.propertyType) sp.set("propertyType", params.propertyType);
  if (params.sort) sp.set("sort", params.sort);
  const res = await fetch(`/api/stays?${sp.toString()}`, { signal: params.signal, cache: "no-store" });
  if (!res.ok) {
    throw new Error(await errorMessageFromResponse(res, `Request failed (${res.status})`));
  }
  return parseJson<{ stays: StayListItem[] }>(res);
}

export async function fetchStay(id: string, signal?: AbortSignal): Promise<{ stay: Stay }> {
  const res = await fetch(`/api/stays/${id}`, { signal, cache: "no-store" });
  if (!res.ok) {
    throw new Error(await errorMessageFromResponse(res, `Request failed (${res.status})`));
  }
  return parseJson<{ stay: Stay }>(res);
}

export async function fetchReviews(
  stayId: string,
  signal?: AbortSignal,
): Promise<{ reviews: Review[] }> {
  const res = await fetch(`/api/stays/${stayId}/reviews`, { signal, cache: "no-store" });
  if (!res.ok) {
    throw new Error(await errorMessageFromResponse(res, `Request failed (${res.status})`));
  }
  return parseJson<{ reviews: Review[] }>(res);
}

export async function postReview(
  stayId: string,
  body: { author: string; rating: number; text: string },
): Promise<{ review: Review }> {
  const res = await fetch(`/api/stays/${stayId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson<{ review?: Review; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  if (!data.review) throw new Error("Malformed response");
  return { review: data.review };
}

export async function fetchBooking(
  id: string,
  signal?: AbortSignal,
): Promise<{ booking: Booking; stay: Stay | null }> {
  const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, { signal, cache: "no-store" });
  if (!res.ok) {
    throw new Error(await errorMessageFromResponse(res, `Request failed (${res.status})`));
  }
  return parseJson<{ booking: Booking; stay: Stay | null }>(res);
}

export async function postBooking(body: {
  stayId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  paymentMethod: string;
}): Promise<{ booking: Booking; quote: { nights: number; subtotal: number; cleaningFee: number; total: number } }> {
  const res = await fetch(`/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson<{
    booking?: Booking;
    quote?: { nights: number; subtotal: number; cleaningFee: number; total: number };
    error?: string;
  }>(res);
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  if (!data.booking || !data.quote) throw new Error("Malformed response");
  return { booking: data.booking, quote: data.quote };
}
