import { describe, expect, it } from "vitest";
import { nightsBetween, quoteStay } from "@/lib/pricing";

describe("nightsBetween", () => {
  it("counts calendar nights between ISO dates", () => {
    expect(nightsBetween("2026-04-01", "2026-04-04")).toBe(3);
  });

  it("returns null for invalid order", () => {
    expect(nightsBetween("2026-04-10", "2026-04-10")).toBeNull();
    expect(nightsBetween("2026-04-10", "2026-04-01")).toBeNull();
  });
});

describe("quoteStay", () => {
  it("includes cleaning fee in total", () => {
    const q = quoteStay({
      basePricePerNight: 100,
      cleaningFee: 25,
      checkIn: "2026-05-01",
      checkOut: "2026-05-04",
    });
    expect(q).toEqual({ nights: 3, subtotal: 300, cleaningFee: 25, total: 325 });
  });
});
