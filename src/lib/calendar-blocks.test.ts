import { describe, expect, it } from "vitest";
import { bookingToInclusiveRange, mergeCalendarBlocks } from "@/lib/calendar-blocks";

describe("bookingToInclusiveRange", () => {
  it("maps checkout-exclusive interval to inclusive last night", () => {
    expect(bookingToInclusiveRange({ checkIn: "2026-04-01", checkOut: "2026-04-04" })).toEqual({
      start: "2026-04-01",
      end: "2026-04-03",
    });
  });
});

describe("mergeCalendarBlocks", () => {
  it("combines static blocks with booking nights", () => {
    const merged = mergeCalendarBlocks([{ start: "2026-06-10", end: "2026-06-12" }], [
      { checkIn: "2026-07-01", checkOut: "2026-07-03" },
    ]);
    expect(merged).toHaveLength(2);
    expect(merged[1]).toEqual({ start: "2026-07-01", end: "2026-07-02" });
  });
});
