import { describe, expect, it } from "vitest";
import { moderateReviewText } from "@/lib/moderation";

describe("moderateReviewText", () => {
  it("accepts reasonable text", () => {
    expect(moderateReviewText("Lovely apartment, would recommend.")).toEqual({ ok: true });
  });

  it("rejects short text", () => {
    const r = moderateReviewText("short");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/8 characters/);
  });

  it("rejects obvious spam patterns", () => {
    const r = moderateReviewText("Great place check https://evil.test for more");
    expect(r.ok).toBe(false);
  });
});
