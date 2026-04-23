import { NextResponse } from "next/server";
import { mergeCalendarBlocks } from "@/lib/calendar-blocks";
import { getStayStore } from "@/lib/stay-store";
import { log } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const started = Date.now();
  const { id } = await context.params;
  const store = getStayStore();
  const stay = store.getStay(id);
  if (!stay) {
    log.warn("api.stays.detail.not_found", { id, ms: Date.now() - started });
    return NextResponse.json({ error: "Stay not found" }, { status: 404 });
  }
  const calendarBlocks = mergeCalendarBlocks(stay.blockedRanges, store.getBookingsForStay(id));
  log.info("api.stays.detail", { id, ms: Date.now() - started });
  return NextResponse.json({ stay, calendarBlocks });
}
