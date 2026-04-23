import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StayCard } from "@/components/stay-card";

const sample = {
  id: "stay-test",
  title: "Test Loft",
  city: "Lisboa",
  country: "Portugal",
  imageUrl: "https://images.unsplash.com/photo-1501117716987-c8e1ecb2101a?w=400",
  propertyType: "apartment" as const,
  basePricePerNight: 99,
  currency: "EUR",
  ratingAvg: 4.5,
  reviewCount: 12,
  maxGuests: 2,
};

describe("StayCard", () => {
  it("renders title and price", () => {
    render(<StayCard stay={sample} />);
    expect(screen.getAllByText("Test Loft").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/\/ night/)).toBeInTheDocument();
  });
});
