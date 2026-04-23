import { describe, expect, it } from "vitest";
import { isRangeAvailable } from "@/lib/availability";

describe("isRangeAvailable", () => {
  const blocked = [{ start: "2026-06-10", end: "2026-06-12" }];

  it("allows stay that does not touch blocked window", () => {
    expect(isRangeAvailable("2026-06-01", "2026-06-05", blocked)).toBe(true);
    expect(isRangeAvailable("2026-06-13", "2026-06-15", blocked)).toBe(true);
  });

  it("rejects overlap with blocked nights", () => {
    expect(isRangeAvailable("2026-06-09", "2026-06-11", blocked)).toBe(false);
    expect(isRangeAvailable("2026-06-11", "2026-06-14", blocked)).toBe(false);
  });

  it("rejects invalid ranges", () => {
    expect(isRangeAvailable("2026-06-05", "2026-06-05", [])).toBe(false);
  });
});
