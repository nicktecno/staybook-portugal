import { differenceInCalendarDays, parseISO, isValid } from "date-fns";

export function nightsBetween(checkIn: string, checkOut: string): number | null {
  const a = parseISO(checkIn);
  const b = parseISO(checkOut);
  if (!isValid(a) || !isValid(b)) return null;
  const n = differenceInCalendarDays(b, a);
  return n > 0 ? n : null;
}

export function quoteStay(params: {
  basePricePerNight: number;
  cleaningFee: number;
  checkIn: string;
  checkOut: string;
}): { nights: number; subtotal: number; cleaningFee: number; total: number } | null {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  if (nights === null) return null;
  const subtotal = params.basePricePerNight * nights;
  const total = subtotal + params.cleaningFee;
  return { nights, subtotal, cleaningFee: params.cleaningFee, total };
}
