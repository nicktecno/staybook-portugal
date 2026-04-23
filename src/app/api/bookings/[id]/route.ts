import { NextResponse } from "next/server";
import { readSessionUser } from "@/lib/server-session";
import { getStayStore } from "@/lib/stay-store";
import { log } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const started = Date.now();
  const user = await readSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const { id } = await context.params;
  const store = getStayStore();
  const booking = store.getBooking(id);
  if (!booking) {
    log.warn("api.bookings.detail.not_found", { id, ms: Date.now() - started });
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.userId !== user.id) {
    return NextResponse.json({ error: "You don't have permission to view this booking." }, { status: 403 });
  }
  const stay = store.getStay(booking.stayId);
  log.info("api.bookings.detail", { id, ms: Date.now() - started });
  return NextResponse.json({ booking, stay: stay ?? null });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const started = Date.now();
  const user = await readSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const { id } = await context.params;
  const store = getStayStore();
  const result = store.deleteBooking(id, user.id);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 403;
    log.warn("api.bookings.delete_failed", { id, reason: result.reason, ms: Date.now() - started });
    return NextResponse.json(
      {
        error:
          result.reason === "not_found" ? "Booking not found." : "You can't cancel this booking.",
      },
      { status },
    );
  }
  log.info("api.bookings.deleted", { id, userId: user.id, ms: Date.now() - started });
  return NextResponse.json({ ok: true });
}
