import { NextResponse } from "next/server";
import { getStayStore } from "@/lib/stay-store";
import { log } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const started = Date.now();
  const { id } = await context.params;
  const store = getStayStore();
  const booking = store.getBooking(id);
  if (!booking) {
    log.warn("api.bookings.detail.not_found", { id, ms: Date.now() - started });
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  const stay = store.getStay(booking.stayId);
  log.info("api.bookings.detail", { id, ms: Date.now() - started });
  return NextResponse.json({ booking, stay: stay ?? null });
}
