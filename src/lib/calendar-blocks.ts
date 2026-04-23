import { addDays, format, parseISO } from "date-fns";
import type { Booking } from "@/types";

/** Inclusive calendar nights occupied by a booking (check-in through night before check-out). */
export function bookingToInclusiveRange(booking: Pick<Booking, "checkIn" | "checkOut">): {
  start: string;
  end: string;
} {
  const co = parseISO(booking.checkOut);
  const lastNight = addDays(co, -1);
  return { start: booking.checkIn, end: format(lastNight, "yyyy-MM-dd") };
}

export function mergeCalendarBlocks(
  blockedRanges: { start: string; end: string }[],
  bookings: Pick<Booking, "checkIn" | "checkOut">[],
): { start: string; end: string }[] {
  const fromBookings = bookings.map(bookingToInclusiveRange);
  return [...blockedRanges, ...fromBookings];
}
