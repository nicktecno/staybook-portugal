import { NextResponse } from "next/server";
import { mergeCalendarBlocks } from "@/lib/calendar-blocks";
import { isRangeAvailable } from "@/lib/availability";
import { quoteStay } from "@/lib/pricing";
import { readSessionUser } from "@/lib/server-session";
import { getStayStore } from "@/lib/stay-store";
import { log } from "@/lib/logger";
import type { Booking } from "@/types";

export async function GET() {
  const user = await readSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const store = getStayStore();
  const bookings = store.listBookingsForUser(user.id);
  const enriched = bookings.map((b) => ({
    booking: b,
    stay: store.getStay(b.stayId) ?? null,
  }));
  return NextResponse.json({ bookings: enriched });
}

export async function POST(request: Request) {
  const started = Date.now();
  const user = await readSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to book." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const stayId = "stayId" in body && typeof body.stayId === "string" ? body.stayId : "";
  const checkIn = "checkIn" in body && typeof body.checkIn === "string" ? body.checkIn : "";
  const checkOut = "checkOut" in body && typeof body.checkOut === "string" ? body.checkOut : "";
  const guests = "guests" in body && typeof body.guests === "number" ? body.guests : NaN;
  const guestName = "guestName" in body && typeof body.guestName === "string" ? body.guestName : "";
  const paymentMethod =
    "paymentMethod" in body && typeof body.paymentMethod === "string" ? body.paymentMethod : "";

  if (!stayId) return NextResponse.json({ error: "stayId is required" }, { status: 400 });
  if (!checkIn || !checkOut) {
    return NextResponse.json({ error: "checkIn and checkOut are required (YYYY-MM-DD)" }, { status: 400 });
  }
  if (!Number.isFinite(guests) || guests < 1 || !Number.isInteger(guests)) {
    return NextResponse.json({ error: "guests must be a positive integer" }, { status: 400 });
  }
  if (!guestName.trim()) {
    return NextResponse.json({ error: "guestName is required" }, { status: 400 });
  }
  if (!paymentMethod) {
    return NextResponse.json({ error: "paymentMethod is required (mock)" }, { status: 400 });
  }

  const store = getStayStore();
  const stay = store.getStay(stayId);
  if (!stay) {
    return NextResponse.json({ error: "Stay not found" }, { status: 404 });
  }
  if (guests > stay.maxGuests) {
    return NextResponse.json(
      { error: `This stay allows at most ${stay.maxGuests} guests` },
      { status: 422 },
    );
  }

  const calendarBlocks = mergeCalendarBlocks(stay.blockedRanges, store.getBookingsForStay(stayId));
  if (!isRangeAvailable(checkIn, checkOut, calendarBlocks)) {
    log.warn("api.bookings.unavailable", { stayId, checkIn, checkOut, ms: Date.now() - started });
    return NextResponse.json({ error: "Selected dates are not available" }, { status: 409 });
  }

  const quote = quoteStay({
    basePricePerNight: stay.basePricePerNight,
    cleaningFee: stay.cleaningFee,
    checkIn,
    checkOut,
  });
  if (!quote) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const booking: Booking = {
    id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    stayId,
    userId: user.id,
    checkIn,
    checkOut,
    guests,
    guestName: guestName.trim(),
    guestEmail: user.email,
    totalPrice: quote.total,
    currency: stay.currency,
    createdAt: new Date().toISOString(),
    paymentRef: `mock_${paymentMethod}_${Math.random().toString(36).slice(2, 12)}`,
  };

  store.addBooking(booking);
  log.info("api.bookings.created", {
    bookingId: booking.id,
    stayId,
    userId: user.id,
    nights: quote.nights,
    total: quote.total,
    ms: Date.now() - started,
  });

  return NextResponse.json({ booking, quote }, { status: 201 });
}
