export type PropertyType = "hotel" | "apartment" | "hostel";

export type Stay = {
  id: string;
  title: string;
  city: string;
  country: string;
  description: string;
  imageUrl: string;
  propertyType: PropertyType;
  basePricePerNight: number;
  currency: string;
  cleaningFee: number;
  maxGuests: number;
  ratingAvg: number;
  reviewCount: number;
  amenities: string[];
  /** ISO date (YYYY-MM-DD) inclusive ranges where the stay cannot be booked */
  blockedRanges: { start: string; end: string }[];
};

export type Review = {
  id: string;
  stayId: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
  status: "visible" | "rejected";
};

export type Booking = {
  id: string;
  stayId: string;
  /** Account that owns this booking (required for new bookings). */
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  paymentRef: string;
};

export type UserPublic = {
  id: string;
  email: string;
  displayName: string;
};

export type StayListItem = Pick<
  Stay,
  | "id"
  | "title"
  | "city"
  | "country"
  | "imageUrl"
  | "propertyType"
  | "basePricePerNight"
  | "currency"
  | "ratingAvg"
  | "reviewCount"
  | "maxGuests"
>;
