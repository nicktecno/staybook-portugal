import { NextResponse } from "next/server";
import { getStayStore } from "@/lib/stay-store";
import { isRangeAvailable } from "@/lib/availability";
import { quoteStay } from "@/lib/pricing";
import { log } from "@/lib/logger";
import type { Booking } from "@/types";

export async function POST(request: Request) {
  const started = Date.now();
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
  const guestEmail = "guestEmail" in body && typeof body.guestEmail === "string" ? body.guestEmail : "";
  const paymentMethod =
    "paymentMethod" in body && typeof body.paymentMethod === "string" ? body.paymentMethod : "";

  if (!stayId) return NextResponse.json({ error: "stayId is required" }, { status: 400 });
  if (!checkIn || !checkOut) {
    return NextResponse.json({ error: "checkIn and checkOut are required (YYYY-MM-DD)" }, { status: 400 });
  }
  if (!Number.isFinite(guests) || guests < 1 || !Number.isInteger(guests)) {
    return NextResponse.json({ error: "guests must be a positive integer" }, { status: 400 });
  }
  if (!guestName.trim() || !guestEmail.trim()) {
    return NextResponse.json({ error: "guestName and guestEmail are required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
    return NextResponse.json({ error: "guestEmail looks invalid" }, { status: 400 });
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

  if (!isRangeAvailable(checkIn, checkOut, stay.blockedRanges)) {
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
    checkIn,
    checkOut,
    guests,
    guestName: guestName.trim(),
    guestEmail: guestEmail.trim(),
    totalPrice: quote.total,
    currency: stay.currency,
    createdAt: new Date().toISOString(),
    paymentRef: `mock_${paymentMethod}_${Math.random().toString(36).slice(2, 12)}`,
  };

  store.addBooking(booking);
  log.info("api.bookings.created", {
    bookingId: booking.id,
    stayId,
    nights: quote.nights,
    total: quote.total,
    ms: Date.now() - started,
  });

  return NextResponse.json({ booking, quote }, { status: 201 });
}
