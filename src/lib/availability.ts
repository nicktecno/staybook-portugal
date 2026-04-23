import {
  parseISO,
  isValid,
  isBefore,
  eachDayOfInterval,
  isWithinInterval,
  addDays,
} from "date-fns";

/** Guest stay nights: checkIn through the day before checkOut */
export function isRangeAvailable(
  checkIn: string,
  checkOut: string,
  blockedRanges: { start: string; end: string }[],
): boolean {
  const ci = parseISO(checkIn);
  const co = parseISO(checkOut);
  if (!isValid(ci) || !isValid(co) || !isBefore(ci, co)) return false;
  const lastNight = addDays(co, -1);
  const stayNights = eachDayOfInterval({ start: ci, end: lastNight });

  for (const br of blockedRanges) {
    const bs = parseISO(br.start);
    const be = parseISO(br.end);
    if (!isValid(bs) || !isValid(be)) continue;
    const blockInterval = { start: bs, end: be };
    for (const night of stayNights) {
      if (isWithinInterval(night, blockInterval)) return false;
    }
  }
  return true;
}
